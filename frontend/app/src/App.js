import React from 'react';
import LoginPage from './Components/auth/LoginPage';

function App() {
  return (
    <div className="App">
      <LoginPage />
    </div>
  );
}

export default App;

// import { useEffect } from 'react';

// function App() {
//   useEffect(() => {
//     fetch('http://localhost:8000/api/check')
//       .then(response => {
//         if (!response.ok) {
//           throw new Error('Network response was not ok');
//         }
//         return response.json(); // تحويل الاستجابة إلى JSON
//       })
//       .then(data => {
//         console.log('Response from Laravel:', data);
//       })
//       .catch(error => {
//         console.error('Error connecting to Laravel:', error);
//       });
//   }, []);

//   return (
//     <div>
//       <h1>Checking connection with Laravel</h1>
//     </div>
//   );
// }
//   const handleSend = async () => {
//     try {
//       // await fetch('http://localhost:8000/sanctum/csrf-cookie', {
//       //   credentials: 'include' // مهم جدًا لإرسال الكوكيز
//       // });
//       // console.log('CSRF cookie fetched successfully');
//       const response = await fetch('http://127.0.0.1:8000/api/sample', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         // credentials: "include",
//         body: JSON.stringify({
//           name: 'Ahmed',
//           role: 'Developer'
//         }),
//       });

//       const data = await response.json();
//       console.log('Response:', data);
//     } catch (error) {
//       console.error('Error:', error);
//     }
//   };

//   return (
//     <div>
//       <h2>استدعاء API باستخدام fetch</h2>
//       <button onClick={handleSend}>أرسل البيانات</button>
//     </div>
//   );
// }

// export default App;

// */