import { Outlet } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import { ToastContainer } from 'react-toastify'
import TaskNotification from './components/TaskNotification'
import ChatNotification from './components/ChatNotification'

function App() {

  return (
    <>
      <Navbar/>
      <main className='main-app-container'>
        {<Outlet/>}
      </main>
      <ToastContainer closeOnClick="true" pauseOnFocusLoss="false" autoClose="2000"/>
      <TaskNotification />
      <ChatNotification />
    </>
  )
}

export default App
