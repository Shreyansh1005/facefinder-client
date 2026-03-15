import { Link } from "react-router-dom";
import "./futuristic.css";

function Navbar() {
  return (
    <div className="navbar">

      <Link to="/">Home</Link>
      <Link to="/upload">Upload</Link>
      <Link to="/search">Scan</Link>
      <Link to="/gallery">Gallery</Link>

    </div>
  );
}

export default Navbar;