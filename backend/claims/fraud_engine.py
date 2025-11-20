import logging
import numpy as np
from decimal import Decimal
from django.db.models import Avg, Count

logger = logging.getLogger(__name__)


class FraudScoreEngine:
    def __init__(self):
        self.weights = {
            'amount_variance': 0.40,
            'provider_frequency': 0.30,
            'diagnosis_complexity': 0.30,
        }
    
    def calculate_score(self, claim, provider_stats, diagnosis_stats):
        scores = {
            'amount_variance': self._calculate_amount_variance_score(claim, diagnosis_stats),
            'provider_frequency': self._calculate_provider_frequency_score(claim, provider_stats),
            'diagnosis_complexity': self._calculate_diagnosis_complexity_score(claim),
        }
        
        weighted_score = sum(
            scores[key] * self.weights[key] 
            for key in scores
        )
        
        final_score = min(100, max(0, int(weighted_score)))
        
        logger.debug(f"Claim {claim.get('claim_id', 'N/A')} - Component scores: {scores}, Final: {final_score}")
        
        return final_score
    
    def _calculate_amount_variance_score(self, claim, diagnosis_stats):
        claim_amount = float(claim.get('claim_amount', 0))
        diagnosis_code = claim.get('diagnosis_code', '')
        
        avg_amount = diagnosis_stats.get(diagnosis_code, {}).get('avg_amount', claim_amount)
        
        if avg_amount == 0:
            return 50
        
        variance_ratio = claim_amount / avg_amount
        
        if variance_ratio > 3.0:
            score = 100
        elif variance_ratio > 2.0:
            score = 80
        elif variance_ratio > 1.5:
            score = 60
        elif variance_ratio < 0.5:
            score = 70
        elif variance_ratio < 0.7:
            score = 40
        else:
            score = 20
        
        return score
    
    def _calculate_provider_frequency_score(self, claim, provider_stats):
        provider_id = claim.get('provider_id', '')
        provider_claim_count = provider_stats.get(provider_id, {}).get('claim_count', 1)
        provider_avg_amount = provider_stats.get(provider_id, {}).get('avg_amount', 0)
        claim_amount = float(claim.get('claim_amount', 0))
        
        frequency_score = 0
        if provider_claim_count > 100:
            frequency_score = 40
        elif provider_claim_count > 50:
            frequency_score = 30
        elif provider_claim_count > 20:
            frequency_score = 20
        else:
            frequency_score = 10
        
        if provider_avg_amount > 0:
            amount_deviation = abs(claim_amount - provider_avg_amount) / provider_avg_amount
            if amount_deviation > 2.0:
                frequency_score += 60
            elif amount_deviation > 1.0:
                frequency_score += 30
            else:
                frequency_score += 10
        
        return min(100, frequency_score)
    
    def _calculate_diagnosis_complexity_score(self, claim):
        diagnosis_code = claim.get('diagnosis_code', '')
        claim_amount = float(claim.get('claim_amount', 0))
        
        complexity_score = 0
        
        if len(diagnosis_code) > 6:
            complexity_score += 20
        elif len(diagnosis_code) > 4:
            complexity_score += 10
        else:
            complexity_score += 5
        
        if claim_amount > 50000:
            complexity_score += 60
        elif claim_amount > 20000:
            complexity_score += 40
        elif claim_amount > 10000:
            complexity_score += 20
        else:
            complexity_score += 10
        
        return min(100, complexity_score)
