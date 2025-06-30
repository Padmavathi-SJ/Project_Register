import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Provider } from 'react-redux';
import AuthInitializer from "./components/route-guard/AuthInitializer.jsx";
import { store } from "./store/store.js";

// createRoot(document.getElementById("root")).render(
//   <BrowserRouter>
//     <Provider store={store}>
//       <AuthInitializer>
//         <App />
//       </AuthInitializer>
//     </Provider>
//   </BrowserRouter>
// );




import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from "./store/store.js";
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthInitializer>
          <App />
        </AuthInitializer>
      </PersistGate>
    </Provider>
  </BrowserRouter>
);