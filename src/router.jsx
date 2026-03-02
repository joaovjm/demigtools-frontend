import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router";
//import Navbar from "./components/Navbar";
import App from "./App";
import Login from "./pages/Login";
import Donor from "./pages/Donor";
import SearchDonor from "./pages/SearchDonor";
import NewDonor from "./pages/NewDonor";
import Page404 from "./pages/Page404";
import ReceiverDonations from "./pages/ReceiverDonations";
import ChangeCollector from "./pages/ChangeCollector";
import CheckPrint from "./pages/CheckPrint";
import AdminManager from "./pages/AdminManager";
import CollectorsMoviment from "./pages/CollectorsMoviment";
import CountDonations from "./pages/CountDonations";
import DonationsReceived from "./pages/DonationsReceived";
import Operators from "./pages/Operators";
import OperatorWork from "./pages/OperatorWork";
import OperatorReport from "./pages/OperatorReport";
import WorkHistory from "./pages/WorkHistory";
import WorkList from "./pages/WorkList";
import Wrapper from "./components/Wrapper";
import UsersManager from "./pages/UsersManager";
import Dashboard from "./pages/Dashboard";
import CreateMensalDonation from "./pages/CreateMensalDonation";
import LoadLeads from "./pages/LoadLeads";
import Leads from "./pages/Leads";
import Home from "./pages/Home";
import Request from "./pages/Request";
import DashboardAdmin from "./pages/DashboardAdmin";
import ProtectedRoute from "./components/ProtectedRoute";
import Chat from "./pages/Chat";
import Tasks from "./pages/Tasks";
import MyTasks from "./pages/MyTasks";
import MonthHistory from "./pages/MonthHistory";
import BulkEmailSend from "./pages/BulkEmailSend";
import TaskDevelopment from "./pages/TaskDevelopment";
import TaskToDeveloper from "./pages/TaskToDeveloper";

const AppRoutesContent = () => {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      <Route element={<App />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/leads"
          element={
            <Wrapper>
              <Leads />
            </Wrapper>
          }
        />
        <Route element={<ProtectedRoute requiredRole="Operador" />}>
          <Route
            path="/dashboard"
            element={
              <Wrapper>
                <Dashboard />
              </Wrapper>
            }
          />
        </Route>

        <Route
          path="/searchdonor"
          element={<Wrapper>{<SearchDonor />}</Wrapper>}
        />
        <Route
          path="/donor/:id"
          element={
            <Wrapper>
              <Donor />
            </Wrapper>
          }
        />
        <Route
          path="/newdonor"
          element={
            <Wrapper>
              <NewDonor />
            </Wrapper>
          }
        />
        <Route
          path="*"
          element={
            <Wrapper>
              <Page404 />
            </Wrapper>
          }
        />

        <Route
          path="/worklist"
          element={
            <Wrapper>
              <WorkList />
            </Wrapper>
          }
        />

        <Route
          path="/operatorreport"
          element={
            <Wrapper>
              <OperatorReport />
            </Wrapper>
          }
        />

        <Route
          path="/chat"
          element={
            <Wrapper>
              <Chat />
            </Wrapper>
          }
        />

        <Route
          path="/mytasks"
          element={
            <Wrapper>
              <MyTasks />
            </Wrapper>
          }
        />

        <Route
          path="/tasktodeveloper"
          element={
            <Wrapper>
              <TaskToDeveloper />
            </Wrapper>
          }
        />

        <Route element={<ProtectedRoute requiredRole="Admin" />}>
          <Route
            path="/dashboardAdmin"
            element={
              <Wrapper>
                <DashboardAdmin />
              </Wrapper>
            }
          />
          <Route
            path="/bulkemailsend"
            element={
              <Wrapper>
                <BulkEmailSend />
              </Wrapper>
            }
          />
          <Route
            path="/request"
            element={
              <Wrapper>
                <Request />
              </Wrapper>
            }
          />
          <Route
            path="/tasks"
            element={
              <Wrapper>
                <Tasks />
              </Wrapper>
            }
          />
          <Route
            path="/taskdevelopment"
            element={
              <Wrapper>
                <TaskDevelopment />
              </Wrapper>
            }
          />
          <Route
            path="/loadleads"
            element={
              <Wrapper>
                <LoadLeads />
              </Wrapper>
            }
          />
          <Route
            path="/usersmanager"
            element={
              <Wrapper>
                <UsersManager />
              </Wrapper>
            }
          />
          <Route
            path="/createmensaldonation"
            element={
              <Wrapper>
                <CreateMensalDonation />
              </Wrapper>
            }
          />
          <Route
            path="/operators"
            element={
              <Wrapper>
                <Operators />
              </Wrapper>
            }
          />
          <Route
            path="/operatorwork"
            element={
              <Wrapper>
                <OperatorWork />
              </Wrapper>
            }
          />
          <Route
            path="/workhistory"
            element={
              <Wrapper>
                <WorkHistory />
              </Wrapper>
            }
          />
          <Route
            path="/monthhistory"
            element={
              <Wrapper>
                <MonthHistory />
              </Wrapper>
            }
          />
        </Route>
        <Route
          path="/countdonations"
          element={
            <Wrapper>
              <CountDonations />
            </Wrapper>
          }
        />
        <Route
          path="/donationsreceived"
          element={
            <Wrapper>
              <DonationsReceived />
            </Wrapper>
          }
        />
        <Route
          path="/receiverdonations"
          element={
            <Wrapper>
              <ReceiverDonations />
            </Wrapper>
          }
        />
        <Route
          path="/changecollector"
          element={
            <Wrapper>
              <ChangeCollector />
            </Wrapper>
          }
        />
        <Route
          path="/checkprint"
          element={
            <Wrapper>
              <CheckPrint />
            </Wrapper>
          }
        />
        <Route
          path="/adminmanager"
          element={
            <Wrapper>
              <AdminManager />
            </Wrapper>
          }
        />
        <Route
          path="/collectorsmoviment"
          element={
            <Wrapper>
              <CollectorsMoviment />
            </Wrapper>
          }
        />
      </Route>
    </Routes>
  );
};

const Approuter = () => {
  return (
    <BrowserRouter>
      <AppRoutesContent />
    </BrowserRouter>
  );
};

export default Approuter;
