import React, { useState, useEffect } from 'react';

function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:5000/notifications', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  return (
    <div className="notifications">
      <h3>Notifications</h3>
      {notifications.map(notification => (
        <div key={notification.id} className="notification">
          <p>{notification.message}</p>
          <small>{new Date(notification.created_at).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}

export default Notifications;