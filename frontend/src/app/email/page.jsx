
'use client';
import { useState } from 'react';


export default function Home() {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const handleSendEmail = async () => {
    setStatus('Sending...');

    try {
      const res = await fetch('http://localhost:5000/email/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, subject, message }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus('Email sent successfully');
      } else {
        setStatus('Failed to send email');
      }
    } catch (error) {
      setStatus('Error occurred while sending email');
    }
  };

  return (
    <div>
      <h1>Send Email</h1>
      <input
        type="email"
        placeholder="Recipient Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="text"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <textarea
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={handleSendEmail}>Send Email</button>
      <p>{status}</p>
    </div>
  );
}
