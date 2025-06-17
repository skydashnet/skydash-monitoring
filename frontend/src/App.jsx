import { Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeProvider';
import { AuthProvider } from './context/AuthProvider';
import { MikrotikProvider } from './context/MikrotikProvider';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MikrotikProvider>
          <Outlet />
        </MikrotikProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;







// import Header from './components/Header';
// import Navbar from './components/Navbar';
// import MainContent from './components/MainContent';
// import Sidebar from './components/Sidebar';
// import PppoeTable from './components/PppoeTable';

// export default function App() {
//   return (
//     <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-blue-200 dark:bg-gradient-to-br dark:from-gray-900 dark:to-purple-950 text-gray-800 dark:text-white transition-colors duration-300">
//       <Header />
//       <main className="flex-1 overflow-y-auto pb-32">
//         <div className="flex flex-col lg:flex-row p-4 gap-4">
//           <MainContent />
//           <Sidebar />
//         </div>
//         <div className="px-4 pb-4">
//           <PppoeTable />
//         </div>
//       </main>
//       <Navbar />
//     </div>
//   );
// }