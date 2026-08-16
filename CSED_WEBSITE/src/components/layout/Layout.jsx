import Navbar from "../Navbar/Navbar";
import Hero from "../Hero/Hero";

function Layout() {
  return (
    <div className="absolute inset-0 z-10">
      <Navbar />
      <Hero />
    </div>
  );
}

export default Layout;