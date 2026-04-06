export const mockVolunteers = [];

export const mockDisasters = [
    {
        id: 1,
        name: "Downtown Flood",
        type: "Flood",
        description: "Severe flooding in the downtown district due to heavy rainfall.",
        urgency: "critical",
        status: "active",
        latitude: 34.0488,
        longitude: -118.2518,
        city: "Los Angeles",
        state: "CA",
        created_by: "admin-1"
    },
    {
        id: 2,
        name: "North Hills Fire",
        type: "Fire",
        description: "Brush fire spreading rapidly near residential areas.",
        urgency: "high",
        status: "active",
        latitude: 34.2231,
        longitude: -118.4851,
        city: "Los Angeles",
        state: "CA",
        created_by: "admin-1"
    }
];

export const mockTasks = [
    {
        id: 1,
        title: "Evacuation Assistance",
        description: "Assist elderly residents in evacuating the flood zone.",
        urgency: "critical",
        status: "open",
        required_skills: ["Driving", "First Aid"],
        disaster_id: 1,
        created_by: "admin-1"
    },
    {
        id: 2,
        title: "Sandbag Distribution",
        description: "Distribute sandbags to local businesses to prevent water damage.",
        urgency: "high",
        status: "assigned",
        required_skills: ["Logistics", "Heavy Lifting"],
        disaster_id: 1,
        created_by: "admin-1"
    },
    {
        id: 3,
        title: "Medical Triage Support",
        description: "Assist paramedics at the field hospital.",
        urgency: "critical",
        status: "open",
        required_skills: ["Medical", "First Aid"],
        disaster_id: 2,
        created_by: "admin-1"
    }
];

export const mockAssignments = [
    {
        id: 1,
        task_id: 2,
        volunteer_id: 2, // Maps to Mike Ross (by index+1 logic in seed or direct mapping) -> logic in seed is by ID mapping
        status: "in_progress",
        assigned_at: new Date().toISOString()
    }
];

export const mockUpdates = [
    {
        id: 1,
        title: "Flood Waters Rising",
        message: "Water levels have risen 2 inches in the last hour. Immediate evacuation required for Zone A.",
        priority: "critical",
        disaster_id: 1,
        created_by: "admin-1",
        created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    },
    {
        id: 2,
        title: "Shelter Capacity Reached",
        message: "The downtown shelter is full. Redirecting evacuees to the North High School gymnasium.",
        priority: "high",
        disaster_id: 1,
        created_by: "admin-1",
        created_at: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
    }
];
