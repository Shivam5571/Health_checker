import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Yahan par 'import ./index.css' jaisi line ho sakti hai, usey hata dena hai.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
