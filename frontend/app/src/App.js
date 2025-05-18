// import React from 'react';
// import LoginPage from './Components/auth/LoginPage';

// function App() {
//   return (
//     <div className="App">
//       <LoginPage />
//     </div>
//   );
// }

// export default App;

import { useEffect } from 'react';

function App() {
  useEffect(() => {
    fetch('http://localhost:8000/console/check-connection')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json(); // تحويل الاستجابة إلى JSON
      })
      .then(data => {
        console.log('Response from Laravel:', data);
      })
      .catch(error => {
        console.error('Error connecting to Laravel:', error);
      });
  }, []);

  return (
    <div>
      <h1>Checking connection with Laravel</h1>
    </div>
  );
}

export default App;

// */