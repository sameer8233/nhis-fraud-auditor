from rest_framework import serializers
from .models import Claim


class ClaimSerializer(serializers.ModelSerializer):
    fraud_risk_level = serializers.ReadOnlyField()
    
    class Meta:
        model = Claim
        fields = [
            'id',
            'claim_id',
            'patient_id',
            'provider_id',
            'diagnosis_code',
            'diagnosis_description',
            'procedure_code',
            'procedure_description',
            'claim_amount',
            'claim_date',
            'service_date',
            'fraud_score',
            'fraud_risk_level',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['fraud_score', 'fraud_risk_level', 'created_at', 'updated_at']


class DashboardMetricsSerializer(serializers.Serializer):
    total_claims = serializers.IntegerField()
    average_claim_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    high_risk_claims_count = serializers.IntegerField()
    high_risk_claims_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    fraud_score_distribution = serializers.DictField()
