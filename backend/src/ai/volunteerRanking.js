import { calculateDistance } from '../services/geocoding.js';

/**
 * AI-based volunteer ranking algorithm
 * Scores volunteers based on multiple criteria and returns top candidates
 */

/**
 * Calculate skill match score (0-100)
 * @param {Array<string>} volunteerSkills - Skills the volunteer has
 * @param {Array<string>} requiredSkills - Skills required for the task
 * @returns {number} Score from 0 to 100
 */
function calculateSkillScore(volunteerSkills, requiredSkills) {
    if (!requiredSkills || requiredSkills.length === 0) {
        return 50; // Neutral score if no specific skills required
    }

    if (!volunteerSkills || volunteerSkills.length === 0) {
        return 0; // No skills = lowest score
    }

    const matchingSkills = requiredSkills.filter(skill =>
        volunteerSkills.some(vSkill =>
            vSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(vSkill.toLowerCase())
        )
    );

    const matchPercentage = matchingSkills.length / requiredSkills.length;
    return Math.round(matchPercentage * 100);
}

/**
 * Calculate distance score (0-100)
 * Closer volunteers get higher scores
 * @param {number} distance - Distance in kilometers
 * @returns {number} Score from 0 to 100
 */
function calculateDistanceScore(distance) {
    // Score decreases logarithmically with distance
    // 0-10km: 100-90 points
    // 10-50km: 90-70 points
    // 50-200km: 70-40 points
    // 200+km: 40-0 points

    if (distance <= 10) {
        return 100 - (distance * 1);
    } else if (distance <= 50) {
        return 90 - ((distance - 10) * 0.5);
    } else if (distance <= 200) {
        return 70 - ((distance - 50) * 0.2);
    } else {
        return Math.max(0, 40 - ((distance - 200) * 0.1));
    }
}

/**
 * Calculate availability score (0-100)
 * @param {string} availability - 'available', 'busy', 'offline'
 * @returns {number} Score from 0 to 100
 */
function calculateAvailabilityScore(availability) {
    const scores = {
        'available': 100,
        'busy': 50,
        'offline': 0
    };
    return scores[availability?.toLowerCase()] || 0;
}

/**
 * Calculate reliability score (0-100)
 * Uses stored reliability score from database
 * @param {number} storedScore - Score from database
 * @returns {number} Score from 0 to 100
 */
function calculateReliabilityScore(storedScore) {
    // Ensure score is within 0-100 range
    // Default is 100, can go higher or lower, but we clamp for the algorithm
    const score = storedScore !== undefined ? storedScore : 100;
    return Math.max(0, Math.min(100, score));
}

/**
 * Get weight adjustments based on disaster urgency
 * @param {string} urgency - 'critical', 'high', 'medium', 'low'
 * @returns {object} Weight multipliers for each criterion
 */
function getUrgencyWeights(urgency) {
    const weights = {
        critical: {
            distance: 1.5,      // Distance is super important
            availability: 1.5,  // Must be available now
            skill: 0.8,         // Skills less critical in emergencies
            reliability: 0.7    // Less time to verify
        },
        high: {
            distance: 1.2,
            availability: 1.3,
            skill: 1.0,
            reliability: 0.9
        },
        medium: {
            distance: 1.0,
            availability: 1.0,
            skill: 1.1,
            reliability: 1.0
        },
        low: {
            distance: 0.8,
            availability: 0.9,
            skill: 1.3,          // Can be selective about skills
            reliability: 1.2     // Can prioritize reliable volunteers
        }
    };

    return weights[urgency?.toLowerCase()] || weights.medium;
}

/**
 * Rank volunteers for a specific task
 * @param {Array} volunteers - Array of volunteer objects
 * @param {object} task - Task object with requirements
 * @param {object} disaster - Disaster object with location and urgency
 * @param {object} targetLocation - { latitude, longitude } to measure distance from
 * @returns {Array} Ranked volunteers with scores
 */
export function rankVolunteers(volunteers, task, disaster, targetLocation) {
    if (!volunteers || volunteers.length === 0) {
        return [];
    }

    const urgencyWeights = getUrgencyWeights(disaster?.urgency || 'medium');
    const rankedVolunteers = [];

    // Default to disaster location if no target location provided (though caller should handle this)
    const targetLat = targetLocation?.latitude || disaster?.latitude;
    const targetLng = targetLocation?.longitude || disaster?.longitude;

    for (const volunteer of volunteers) {
        // Calculate individual scores
        const skillScore = calculateSkillScore(volunteer.skills, task.required_skills);

        let distance = 9999; // Default to far away if no location
        if (targetLat && targetLng && volunteer.latitude && volunteer.longitude) {
            distance = calculateDistance(
                volunteer.latitude,
                volunteer.longitude,
                targetLat,
                targetLng
            );
        }

        const distanceScore = calculateDistanceScore(distance);

        const availabilityScore = calculateAvailabilityScore(volunteer.availability);
        const reliabilityScore = calculateReliabilityScore(
            volunteer.reliability_score
        );

        // Apply urgency weights
        const weightedSkillScore = skillScore * urgencyWeights.skill;
        const weightedDistanceScore = distanceScore * urgencyWeights.distance;
        const weightedAvailabilityScore = availabilityScore * urgencyWeights.availability;
        const weightedReliabilityScore = reliabilityScore * urgencyWeights.reliability;

        // Calculate final composite score
        const totalWeight =
            urgencyWeights.skill +
            urgencyWeights.distance +
            urgencyWeights.availability +
            urgencyWeights.reliability;

        const finalScore = (
            weightedSkillScore +
            weightedDistanceScore +
            weightedAvailabilityScore +
            weightedReliabilityScore
        ) / totalWeight;

        rankedVolunteers.push({
            task_id: task.id, // Add task_id here so frontend can use it
            volunteer_id: volunteer.id,
            volunteer_name: volunteer.name,
            volunteer_email: volunteer.email,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal
            scores: {
                skill: Math.round(skillScore),
                distance: Math.round(distanceScore),
                availability: Math.round(availabilityScore),
                reliability: Math.round(reliabilityScore),
                final: Math.round(finalScore)
            },
            volunteer_data: volunteer
        });
    }

    // Sort by final score (highest first) and return top candidates
    rankedVolunteers.sort((a, b) => b.scores.final - a.scores.final);

    return rankedVolunteers;
}

/**
 * Get top N volunteers for a task
 * @param {Array} volunteers - Array of volunteer objects
 * @param {object} task - Task object
 * @param {object} disaster - Disaster object
 * @param {number} topN - Number of top volunteers to return (default: 5)
 * @param {object} targetLocation - Optional override for distance calculation
 * @returns {Array} Top N ranked volunteers
 */
export function getTopVolunteers(volunteers, task, disaster, topN = 5, targetLocation = null) {
    const ranked = rankVolunteers(volunteers, task, disaster, targetLocation);
    return ranked.slice(0, topN);
}

export default { rankVolunteers, getTopVolunteers };
