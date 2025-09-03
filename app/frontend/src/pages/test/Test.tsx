import React, { useEffect } from 'react';
// import { v4 as uuidv4 } from 'uuid';
import { saveUserActivityApi } from '../../api/api';

const Test = () => {
  // Generate and store session_id if not already present
  useEffect(() => {
    const existingSessionId = sessionStorage.getItem('session_id');
    if (!existingSessionId) {
      const newSessionId = "01234567"// uuidv4();
      sessionStorage.setItem('session_id', newSessionId);
    }
  }, []);

  const handleApiCall = async () => {
    try {
      const idToken = 'your-id-token'; // Replace with actual token retrieval logic
      const activity = {
        session_id: sessionStorage.getItem('session_id'),
        page: '/test', // Current page path
        activityType: 'button_click', // Type of activity
        activityContent: 'User clicked the Save User Activity button', // Description of the activity
      };
      const result = await saveUserActivityApi(activity, idToken);
      console.log('Activity saved:', result);
    } catch (error) {
      console.error('Error occurred while saving activity:', error);
    }
  };

  return (
    <div>
      <h1>Test Page</h1>
      <button onClick={handleApiCall}>Save User Activity</button>
    </div>
  );
};

export default Test;