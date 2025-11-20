from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count, Q
import logging

from .models import Claim
from .serializers import ClaimSerializer, DashboardMetricsSerializer

logger = logging.getLogger(__name__)


class ClaimViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Claim.objects.all()
    serializer_class = ClaimSerializer
    
    def get_queryset(self):
        queryset = Claim.objects.all()
        
        search = self.request.query_params.get('search', None)
        diagnosis = self.request.query_params.get('diagnosis', None)
        patient_id = self.request.query_params.get('patient_id', None)
        provider_id = self.request.query_params.get('provider_id', None)
        min_score = self.request.query_params.get('min_score', None)
        max_score = self.request.query_params.get('max_score', None)
        
        if search:
            queryset = queryset.filter(
                Q(claim_id__icontains=search) |
                Q(patient_id__icontains=search) |
                Q(provider_id__icontains=search) |
                Q(diagnosis_code__icontains=search) |
                Q(diagnosis_description__icontains=search)
            )
        
        if diagnosis:
            queryset = queryset.filter(diagnosis_code__icontains=diagnosis)
        
        if patient_id:
            queryset = queryset.filter(patient_id__icontains=patient_id)
        
        if provider_id:
            queryset = queryset.filter(provider_id__icontains=provider_id)
        
        if min_score is not None:
            queryset = queryset.filter(fraud_score__gte=int(min_score))
        
        if max_score is not None:
            queryset = queryset.filter(fraud_score__lte=int(max_score))
        
        logger.info(f"Filtered queryset: {queryset.count()} claims")
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def dashboard_metrics(self, request):
        total_claims = Claim.objects.count()
        
        if total_claims == 0:
            return Response({
                'total_claims': 0,
                'average_claim_amount': 0,
                'high_risk_claims_count': 0,
                'high_risk_claims_percentage': 0,
                'fraud_score_distribution': {
                    'Low (0-25)': 0,
                    'Medium (26-75)': 0,
                    'High (76-100)': 0,
                }
            })
        
        avg_amount = Claim.objects.aggregate(Avg('claim_amount'))['claim_amount__avg'] or 0
        high_risk_count = Claim.objects.filter(fraud_score__gt=75).count()
        high_risk_percentage = (high_risk_count / total_claims * 100) if total_claims > 0 else 0
        
        low_count = Claim.objects.filter(fraud_score__lte=25).count()
        medium_count = Claim.objects.filter(fraud_score__gt=25, fraud_score__lte=75).count()
        high_count = Claim.objects.filter(fraud_score__gt=75).count()
        
        metrics = {
            'total_claims': total_claims,
            'average_claim_amount': round(avg_amount, 2),
            'high_risk_claims_count': high_risk_count,
            'high_risk_claims_percentage': round(high_risk_percentage, 2),
            'fraud_score_distribution': {
                'Low (0-25)': low_count,
                'Medium (26-75)': medium_count,
                'High (76-100)': high_count,
            }
        }
        
        logger.info(f"Dashboard metrics calculated: {metrics}")
        
        return Response(metrics)
