import React from 'react';

const Test = () => {
  const handleApiCall = async () => {
    try {
      const response = await fetch('/save-user-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activity: 'User clicked the button' }), // Replace with actual activity data
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Activity saved:', result);
      } else {
        console.error('Failed to save activity:', response.statusText);
      }
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