import './App.scss';
import Footer from './Components/Footer/Footer';
import Header from './Components/Header/Header';
import { Outlet, NavLink, useLocation } from 'react-router-dom';


const App = () => {

  const location = useLocation();
  let pathnameClass = location.pathname.replace('/', '');
  pathnameClass = (pathnameClass.includes('/')) ? pathnameClass.replace(/\//g, '-') : pathnameClass;
  pathnameClass = (pathnameClass === "") ? "home" : pathnameClass;
  return (
    <div className={`app ${pathnameClass}`}>
      <Header>
      </Header>
      <div className='container body'>
        <Outlet />
      </div>
      <Footer>
        <nav>
          <NavLink to="/about" 
            className={({isActive}) => {return (isActive) ? 'active' : '' }}
          >About Translator</NavLink>
          <NavLink to="/privacy-policy" 
            className={({isActive}) => {return (isActive) ? 'active' : '' }}
          >Privacy Policy</NavLink>
          <NavLink to="/contact-us" 
            className={({isActive}) => {return (isActive) ? 'active' : '' }}
          >Contact Us</NavLink>
          <NavLink to="/help" 
            className={({isActive}) => {return (isActive) ? 'active' : '' }}
          >Help</NavLink>
        </nav>
      </Footer>
    </div>
  );
}

export default App;
