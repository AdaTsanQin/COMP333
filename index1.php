<?
// comp333 
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>WesDash - Main Page</title>
    <link rel="preload" href="styles.css" as="style">
    <link rel="stylesheet" href="styles.css" />   
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="WesDash is your campus delivery service, offering fast and easy shopping and delivery for students. Sign up today to get started!" />
</head>

<body>
    <!-- navigation Section -->
    <div class="navbar">
        <ul>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#strength-technology">Strength and Technology</a></li>
            <li><a href="#reviews-heading">APP Reviews</a></li>
            <li><a href="#signup">Register</a></li>
        </ul>
    </div>


    <!-- Hero Section -->
    <div class="hero-section" id="hero-section">
        <p id="wesdash">WesDash</p>
        <!-- Hero subtitle -->
        <p id="hero-subtitle">Your campus delivery made simple.</p>
        <!-- button to how it works part -->
        <a class="hero-btn" href="#signup">Get Started</a>
    </div>

    
    <!-- “How It Works” section -->
    <div class="howitwork-box" id="how-it-works">
        <header>
            <h1>How Our App Works</h1>
        </header>
        <h2>Step 1: Submit a Request</h2>
        <p>
            List your items, pick a delivery speed (Urgent or Common), 
            and set a drop-off spot (Dorm, Classroom).
            <figure>
                <img src="step1.avif" alt="Buyers send request" width="600" height="400" loading="lazy" />
            </figure>
            <p class="center-text">    
                <a href="https://www.google.com/maps/place/WestCo+1/@41.5541813,-72.6589839,19z/data=!3m1!4b1!4m6!3m5!1s0x89e64a611eb60795:0x6dba5bda8e1ba323!8m2!3d41.5541813!4d-72.6583388!16s%2Fg%2F1hc1vtkll?entry=ttu&g_ep=EgoyMDI1MDIxOC4wIKXMDSoJLDEwMjExNDUzSAFQAw%3D%3D" class="implicit-link" target="_blank">
                    Click here to view the relative location between the on-campus shop and residence halls on Google Maps
                </a>                
           </p>
        </p> 

        <h2>Step 2: Wait for a Shopper</h2>
        <p>
            A "Wes dasher" sees your request, shops for you, and updates you along the way.
            <figure>
                <img src="step2.avif" alt="Shopper pick items" width="600" height="400" loading="lazy" />
            </figure>
            <p class="center-text">    
                <a href="https://www.wesleyan.edu/dining/Hours%20of%20Operation.html" class="implicit-link" target="_blank">
                    Click here to see the hours of operation of WesShop
                </a>
                </a>                
           </p>
        </p>    

        <h2>Step 3: Arrange Drop-off</h2>
        <p>
            Meet at the chosen location, check your items, then leave a rating 
            and tip!<br> 
            <figure>
                <img src="step3.avif" alt="Handover between Buyers and Shoppers" width="600" height="400" loading="lazy" />
            </figure>
            <p class="center-text">    
                 <a href="price_list.html" class="implicit-link">
                    Click here to see the precise price.
                </a>
            </p>
        </p>
    </div>

     <!-- “slogan” section -->
    <div class="advert-slogans">
        <div class="buyers">
            <h2>Buyers:</h2>
            <h3 class="advert-slogan">
            “Don't want to go out?”<br>“Let Wes Dasher run the errands for you!”
            </h3>
        </div>
        <div class="shoppers">
            <h2>Shoppers:</h2>
            <h3 class="advert-slogan">
            “Looking to earn extra cash?”<br>“Grab a request on your next trip—it's that simple!”
            </h3>
        </div>
    </div>

    <!-- Signup section  -->
    <div id="signup">
        <h1>Join us now</h1>
        <p>
            Interested in this app? Pre-register now to get five discount uses!
        </p>
    </div>


    <div class="signup-form">
        <form action="register.php" method="GET">
            <input 
                type="submit" 
                value="Register" 
            />
        </form>
    </div>
    <!--Strength and Technology section-->
    <div class="gallery" id="strength-technology">
    <h1>Our Strength and Technology</h1>  
      <figure>
        <img src="mapping.avif" alt="Campus Map" width="630" height="400" loading="lazy" />
        <figcaption>By accurately locating the relative location of the user, the buyer and Shoppers whose bedroom is nearest are selected for the convenience of both parties.</figcaption>
      </figure>
  
  
      <figure>
        <img src="warning.avif" alt="Warning Message" width="630" height="400" loading="lazy" />
        <figcaption>Estimate how far Shoppers will be from the store and issue a 'not able to reach destination before closed' warning.</figcaption>
      </figure>
  
  
      <figure>
        <img src="replace.avif" alt="Item Replacement Request" width="630" height="400" loading="lazy" />
        <figcaption>Shoppers can update the situation of the store and make a request to buy similar items to the Buyers in view of the absence of goods.</figcaption>
      </figure>
  
  
      <figure>
        <img src="rating.avif" alt="Rating System" width="630" height="400"loading="lazy" />
        <figcaption>Shoppers and Buyers rate each other, giving both parties the right to choose a collaborator with a higher rating.</figcaption>
      </figure>

    </div>

    <a href="contract.html" class="implicit-link">
        Click here to see the contract our users need to agree to.
    </a>
    
    <div class="flex-container">
        <figcaption class="advert-slogans" style="width: 40vh; height:50vh; padding:0; margin:0; align-items: center;">
            <h2>What are Users Saying?</h2>
            <p style="color:rgb(237, 241, 240)">Join us and be one of the 100+ happy WesDashers!!</p>
        </figcaption>
        <div class="iframe-container" id="reviews-heading">
            <iframe src="reviews.html" class="mini-window" loading="lazy" title="User reviews of WesDash"></iframe>
        </div>
        
    </div>  
    

</body>
</html>
