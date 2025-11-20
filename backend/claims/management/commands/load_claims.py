from django.core.management.base import BaseCommand
from claims.models import Claim
from claims.fraud_engine import FraudScoreEngine
import pandas as pd
import logging
from decimal import Decimal
from datetime import datetime

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Load claims data from CSV file and calculate fraud scores'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to CSV file')

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        
        self.stdout.write(f'Loading claims from {csv_file}...')
        
        try:
            df = pd.read_csv(csv_file)
            
            provider_stats = self._calculate_provider_stats(df)
            diagnosis_stats = self._calculate_diagnosis_stats(df)
            
            fraud_engine = FraudScoreEngine()
            
            claims_to_create = []
            for index, row in df.iterrows():
                claim_data = {
                    'claim_id': str(row.get('ClaimID', f'CLAIM_{index}')),
                    'patient_id': str(row.get('PatientID', f'PAT_{index}')),
                    'provider_id': str(row.get('ProviderID', f'PROV_{index}')),
                    'diagnosis_code': str(row.get('DiagnosisCode', 'N/A')),
                    'diagnosis_description': str(row.get('DiagnosisDescription', '')),
                    'procedure_code': str(row.get('ProcedureCode', '')),
                    'procedure_description': str(row.get('ProcedureDescription', '')),
                    'claim_amount': float(row.get('ClaimAmount', row.get('Amount', 0))),
                    'claim_date': row.get('ClaimDate', datetime.now().date()),
                }
                
                fraud_score = fraud_engine.calculate_score(claim_data, provider_stats, diagnosis_stats)
                
                claim = Claim(
                    claim_id=claim_data['claim_id'],
                    patient_id=claim_data['patient_id'],
                    provider_id=claim_data['provider_id'],
                    diagnosis_code=claim_data['diagnosis_code'],
                    diagnosis_description=claim_data.get('diagnosis_description', ''),
                    procedure_code=claim_data.get('procedure_code', ''),
                    procedure_description=claim_data.get('procedure_description', ''),
                    claim_amount=Decimal(str(claim_data['claim_amount'])),
                    claim_date=claim_data['claim_date'],
                    fraud_score=fraud_score
                )
                claims_to_create.append(claim)
                
                if len(claims_to_create) >= 1000:
                    Claim.objects.bulk_create(claims_to_create, ignore_conflicts=True)
                    self.stdout.write(f'Loaded {len(claims_to_create)} claims...')
                    claims_to_create = []
            
            if claims_to_create:
                Claim.objects.bulk_create(claims_to_create, ignore_conflicts=True)
            
            total_claims = Claim.objects.count()
            self.stdout.write(self.style.SUCCESS(f'Successfully loaded {total_claims} total claims'))
            
        except Exception as e:
            logger.error(f'Error loading claims: {str(e)}')
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))

    def _calculate_provider_stats(self, df):
        stats = {}
        provider_col = 'ProviderID' if 'ProviderID' in df.columns else 'Provider'
        amount_col = 'ClaimAmount' if 'ClaimAmount' in df.columns else 'Amount'
        
        if provider_col in df.columns:
            grouped = df.groupby(provider_col)
            for provider, group in grouped:
                stats[str(provider)] = {
                    'claim_count': len(group),
                    'avg_amount': float(group[amount_col].mean()) if amount_col in df.columns else 0
                }
        
        return stats

    def _calculate_diagnosis_stats(self, df):
        stats = {}
        diagnosis_col = 'DiagnosisCode' if 'DiagnosisCode' in df.columns else 'Diagnosis'
        amount_col = 'ClaimAmount' if 'ClaimAmount' in df.columns else 'Amount'
        
        if diagnosis_col in df.columns:
            grouped = df.groupby(diagnosis_col)
            for diagnosis, group in grouped:
                stats[str(diagnosis)] = {
                    'avg_amount': float(group[amount_col].mean()) if amount_col in df.columns else 0
                }
        
        return stats
