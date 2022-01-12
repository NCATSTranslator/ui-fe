import "react-responsive-carousel/lib/styles/carousel.min.css"; 
import { Carousel } from 'react-responsive-carousel';


const Home = () => {
  return (
    <div>
      <Carousel>
        <div className="slide">
          <div className="left">
            <h4>Wecome to Translator!</h4>
            <p className="sub-1">Lorem ipsum dolor sit amet, consectetur adipiscing elit ut aliquam</p>
            <p>Purus rhoncus et amet, tortor elementum rhoncus pellentesque euismod. Nunc arcu vitae laoreet eget. Nec nullam turpis enim metus magna eu augue convallis erat.</p>
          </div>
          <div className="right">
            <img src="assets/1.jpeg" />
          </div>
        </div>
        <div className="slide">

        </div>
        <div className="slide">

        </div>
      </Carousel>
    </div>
  );
}

export default Home;