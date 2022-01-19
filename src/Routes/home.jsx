import "react-responsive-carousel/lib/styles/carousel.min.css"; 
import imageOne from '../Assets/1.jpeg';
import CustomCarousel from "../Components/Carousel/CustomCarousel";


const Home = () => {

  return (
    <div>
      <CustomCarousel numberOfSlides={3}>
        <div className="slide-inside">
          <div className="left">
            <h4>Wecome to Translator!</h4>
            <p className="sub-one">Lorem ipsum dolor sit amet, consectetur adipiscing elit ut aliquam</p>
            <p>Purus rhoncus et amet, tortor elementum rhoncus pellentesque euismod. Nunc arcu vitae laoreet eget. Nec nullam turpis enim metus magna eu augue convallis erat.</p>
          </div>
          <div className="right">
            <img src={imageOne} alt=""/>
          </div>
        </div>
        <div className="slide-inside">
          <div className="left">
            <h4>Query Building</h4>
            <p className="sub-one">How it Works</p>
            <ol>
              <li>Click or drag in a template or  component to begin building a query.</li>
              <li>If needed, remove component fields by hovering over them and clicking the “x.”</li>
              <li>Select a component and type in your desired target subject.</li>
              <li>Submit Query!</li>
            </ol>
            <p className="sub-one">Project History</p>
            <p>You can find your query and results history on the History tab.</p>
          </div>
          <div className="right">
            <img src={imageOne} alt=""/>
          </div>
        </div>
        <div className="slide-inside">

        </div>
      </CustomCarousel>
    </div>
  );
}

export default Home;