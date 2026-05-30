import { Outlet } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import TaskNotification from './components/TaskNotification'

function App() {

  return (
    <>
      <Navbar/>
      <main className='main-app-container'>
        {<Outlet/>}
      </main>
      <TaskNotification />
    </>
  )
}

export default App
