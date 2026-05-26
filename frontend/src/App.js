import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { CartProvider } from "./context/CartContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { CartSheet } from "./components/CartSheet";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import ArtistDetail from "./pages/ArtistDetail";

function App() {
  return (
    <div className="App grain min-h-screen bg-[#050505] text-white">
      <BrowserRouter>
        <CartProvider>
          <Navbar />
          <CartSheet />
          <main className="relative z-[2]">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order/:orderNumber" element={<OrderSuccess />} />
              <Route path="/artists" element={<ArtistDetail />} />
              <Route path="/artists/:slug" element={<ArtistDetail />} />
            </Routes>
          </main>
          <Footer />
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "#0a0a0a",
                border: "1px solid #27272a",
                color: "#ffffff",
                borderRadius: 0,
              },
            }}
          />
        </CartProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
