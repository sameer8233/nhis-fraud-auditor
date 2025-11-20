from django.db import models
import logging

logger = logging.getLogger(__name__)


class Claim(models.Model):
    claim_id = models.CharField(max_length=100, unique=True, db_index=True)
    patient_id = models.CharField(max_length=100, db_index=True)
    provider_id = models.CharField(max_length=100, db_index=True)
    diagnosis_code = models.CharField(max_length=50, db_index=True)
    diagnosis_description = models.TextField(blank=True, null=True)
    procedure_code = models.CharField(max_length=50, blank=True, null=True)
    procedure_description = models.TextField(blank=True, null=True)
    claim_amount = models.DecimalField(max_digits=12, decimal_places=2)
    claim_date = models.DateField()
    service_date = models.DateField(blank=True, null=True)
    
    fraud_score = models.IntegerField(default=0, db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-fraud_score', '-claim_date']
        indexes = [
            models.Index(fields=['fraud_score']),
            models.Index(fields=['claim_date']),
            models.Index(fields=['patient_id', 'claim_date']),
            models.Index(fields=['provider_id', 'claim_date']),
        ]
    
    def __str__(self):
        return f"Claim {self.claim_id} - Score: {self.fraud_score}"
    
    @property
    def fraud_risk_level(self):
        if self.fraud_score <= 25:
            return "Low"
        elif self.fraud_score <= 75:
            return "Medium"
        else:
            return "High"
