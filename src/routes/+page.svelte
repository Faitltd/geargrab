<script lang="ts">
  // No JavaScript needed for this static design
</script>

<svelte:head>
  <title>GearGrab - Rent Outdoor Gear from Local Owners</title>
  <meta name="description" content="GearGrab is a peer-to-peer marketplace for outdoor gear rentals. Rent camping, hiking, biking, and water sports equipment from local owners." />
</svelte:head>

<style>
  .hero-section {
    box-sizing: border-box;
    height: 2020px;
    line-height: 24px;
    overflow-block: visible;
    overflow-inline: visible;
    width: 100%;
  }

  .background-container {
    height: 958px;
    overflow-block: hidden;
    overflow-inline: hidden;
    position: fixed;
    width: 100%;
    overflow: hidden;
  }

  .background-image {
    background-image: url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80");
    bottom: -190px;
    height: 1342px;
    overflow-block: visible;
    overflow-inline: visible;
    position: absolute;
    top: -190px;
    width: 100%;
  }

  .background-overlay {
    height: 958px;
    overflow-block: visible;
    overflow-inline: visible;
    position: absolute;
    width: 100%;
  }

  .content-container {
    height: 2020px;
    position: relative;
    width: 100%;
  }

  .main-content {
    height: 1930px;
    min-height: 100vh;
    width: 100%;
  }

  .hero-content {
    align-items: center;
    color: rgb(255, 255, 255);
    flex-direction: column;
    height: 24rem;
    justify-content: center;
    padding-left: 1rem;
    padding-right: 1rem;
    position: relative;
    text-align: center;
    width: 100%;
    display: flex;
  }

  .hero-title {
    font-size: 36px;
    font-weight: 700;
    height: 40px;
    line-height: 40px;
    margin-bottom: 1rem;
    width: 296px;
  }

  .hero-description {
    font-size: 20px;
    height: 56px;
    line-height: 28px;
    margin-bottom: 2rem;
    max-width: 48rem;
    width: 768px;
  }

  .hero-buttons {
    flex-direction: column;
    height: 38px;
    width: 262px;
    display: flex;
    gap: 16px;
  }

  .btn-primary {
    align-items: center;
    background-color: rgb(22, 163, 74);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    height: 38px;
    justify-content: center;
    line-height: 20px;
    padding-bottom: 0.5rem;
    padding-left: 1rem;
    padding-right: 1rem;
    padding-top: 0.5rem;
    width: 118px;
    display: inline-flex;
    border-radius: 12px;
    text-decoration: none;
    color: white;
  }

  .btn-secondary {
    align-items: center;
    background-color: rgb(255, 255, 255);
    color: rgb(22, 163, 74);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    height: 38px;
    justify-content: center;
    line-height: 20px;
    padding-bottom: 0.5rem;
    padding-left: 1rem;
    padding-right: 1rem;
    padding-top: 0.5rem;
    width: 128px;
    display: inline-flex;
    border-width: 2px;
    border-color: rgb(22, 163, 74);
    border-style: solid;
    border-radius: 12px;
    text-decoration: none;
  }

  .section {
    height: 420px;
    padding-bottom: 4rem;
    padding-top: 4rem;
    width: 100%;
  }

  .section-container {
    height: 292px;
    padding-left: 1rem;
    padding-right: 1rem;
    width: 100%;
    margin: auto;
  }

  .section-title {
    color: rgb(255, 255, 255);
    font-size: 30px;
    font-weight: 700;
    height: 36px;
    line-height: 36px;
    text-align: center;
    width: 100%;
  }

  .categories-grid {
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: 256px;
    height: 256px;
    width: 100%;
    display: grid;
    gap: 32px;
  }

  .category-card {
    cursor: pointer;
    height: 256px;
    width: 100%;
    text-decoration: none;
  }

  .category-image-container {
    height: 16rem;
    overflow-block: hidden;
    overflow-inline: hidden;
    position: relative;
    width: 100%;
    border-radius: 16px;
    overflow: hidden;
  }

  .category-image {
    height: 100%;
    object-fit: cover;
    overflow-block: clip;
    overflow-clip-margin: content-box;
    overflow-inline: clip;
    width: 100%;
    overflow: clip;
  }

  .category-overlay {
    height: 256px;
    opacity: 0.7;
    overflow-block: visible;
    overflow-inline: visible;
    position: absolute;
    width: 100%;
  }

  .category-content {
    color: rgb(255, 255, 255);
    height: 84px;
    overflow-block: visible;
    overflow-inline: visible;
    position: absolute;
    top: 172px;
    width: 100%;
    padding: 1rem;
  }

  .category-title {
    font-size: 20px;
    font-weight: 700;
    height: 28px;
    line-height: 28px;
    margin-bottom: 0.25rem;
    width: 100%;
  }

  .category-description {
    font-size: 14px;
    height: 20px;
    line-height: 20px;
    opacity: 0.9;
    width: 100%;
  }

  .how-it-works-section {
    height: 378px;
    padding-bottom: 4rem;
    padding-top: 4rem;
    width: 100%;
  }

  .how-it-works-container {
    height: 250px;
    padding-left: 1rem;
    padding-right: 1rem;
    width: 100%;
    margin: auto;
  }

  .how-it-works-grid {
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: 214px;
    height: 214px;
    width: 100%;
    display: grid;
    gap: 32px;
  }

  .how-it-works-card {
    backdrop-filter: blur(4px);
    height: 214px;
    text-align: center;
    width: 100%;
    border-width: 2px;
    border-color: rgb(229, 231, 235);
    border-style: solid;
    border-radius: 16px;
    padding: 1.5rem;
  }

  .how-it-works-icon {
    align-items: center;
    background-color: rgb(220, 252, 231);
    height: 4rem;
    justify-content: center;
    margin-bottom: 1rem;
    margin-left: auto;
    margin-right: auto;
    width: 4rem;
    display: flex;
    border-radius: 16px;
  }

  .how-it-works-icon svg {
    color: rgb(22, 163, 74);
    height: 2rem;
    overflow-block: hidden;
    overflow-inline: hidden;
    width: 2rem;
    overflow: hidden;
  }

  .how-it-works-title {
    font-size: 20px;
    font-weight: 700;
    height: 28px;
    line-height: 28px;
    margin-bottom: 0.5rem;
    width: 100%;
  }

  .how-it-works-description {
    color: rgb(75, 85, 99);
    height: 48px;
    width: 100%;
  }

  .cta-section {
    align-items: center;
    height: 84px;
    justify-content: center;
    position: relative;
    width: 100%;
    display: flex;
  }

  .cta-content {
    color: rgb(255, 255, 255);
    height: 84px;
    padding-left: 1rem;
    padding-right: 1rem;
    position: relative;
    text-align: center;
    width: 728px;
  }

  .cta-title {
    font-size: 36px;
    font-weight: 700;
    height: 40px;
    line-height: 40px;
    margin-bottom: 1rem;
    width: 100%;
  }

  .cta-description {
    font-size: 20px;
    height: 28px;
    line-height: 28px;
    max-width: 48rem;
    width: 100%;
    margin: auto;
  }

  .testimonials-section {
    height: 350px;
    padding-bottom: 4rem;
    padding-top: 4rem;
    width: 100%;
  }

  .testimonials-container {
    height: 222px;
    padding-left: 1rem;
    padding-right: 1rem;
    width: 100%;
    margin: auto;
  }

  .testimonials-grid {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: 186px;
    height: 186px;
    width: 100%;
    display: grid;
    gap: 32px;
  }

  .testimonial-card {
    backdrop-filter: blur(4px);
    height: 186px;
    width: 100%;
    border-width: 2px;
    border-color: rgb(229, 231, 235);
    border-style: solid;
    border-radius: 16px;
    padding: 1.5rem;
  }

  .testimonial-header {
    align-items: center;
    height: 48px;
    margin-bottom: 1rem;
    width: 100%;
    display: flex;
  }

  .testimonial-avatar {
    height: 3rem;
    max-width: 100%;
    overflow-block: clip;
    overflow-clip-margin: content-box;
    overflow-inline: clip;
    width: 3rem;
    border-radius: 16px;
    overflow: clip;
  }

  .testimonial-info {
    height: 44px;
    margin-left: 1rem;
  }

  .testimonial-name {
    font-weight: 700;
    height: 24px;
    width: 100%;
  }

  .testimonial-location {
    color: rgb(75, 85, 99);
    font-size: 14px;
    height: 20px;
    line-height: 20px;
    width: 100%;
  }

  .testimonial-quote {
    color: rgb(55, 65, 81);
    height: 72px;
    width: 100%;
  }

  .final-cta-section {
    color: rgb(255, 255, 255);
    height: 314px;
    padding-bottom: 4rem;
    padding-top: 4rem;
    width: 100%;
  }

  .final-cta-container {
    height: 186px;
    padding-left: 1rem;
    padding-right: 1rem;
    text-align: center;
    width: 100%;
    margin: auto;
  }

  .final-cta-title {
    font-size: 30px;
    font-weight: 700;
    height: 36px;
    line-height: 36px;
    margin-bottom: 1.5rem;
    width: 100%;
  }

  .final-cta-description {
    font-size: 20px;
    height: 56px;
    line-height: 28px;
    margin-bottom: 2rem;
    margin-left: auto;
    margin-right: auto;
    max-width: 48rem;
    width: 768px;
  }

  .final-cta-buttons {
    flex-direction: column;
    height: 38px;
    justify-content: center;
    width: 100%;
    display: flex;
    gap: 16px;
  }

  .btn-cta-primary {
    align-items: center;
    backdrop-filter: blur(4px);
    color: rgb(22, 163, 74);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    height: 38px;
    justify-content: center;
    line-height: 20px;
    padding-bottom: 0.5rem;
    padding-left: 1rem;
    padding-right: 1rem;
    padding-top: 0.5rem;
    width: 118px;
    display: inline-flex;
    border-radius: 12px;
    text-decoration: none;
  }

  .btn-cta-secondary {
    align-items: center;
    backdrop-filter: blur(4px);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    height: 38px;
    justify-content: center;
    line-height: 20px;
    padding-bottom: 0.5rem;
    padding-left: 1rem;
    padding-right: 1rem;
    padding-top: 0.5rem;
    width: 128px;
    display: inline-flex;
    border-radius: 12px;
    text-decoration: none;
    color: white;
  }

  .footer {
    backdrop-filter: blur(4px);
    color: rgb(255, 255, 255);
    height: 24px;
    position: relative;
    width: 100%;
  }

  .footer-container {
    height: 24px;
    padding-left: 1rem;
    padding-right: 1rem;
    width: 100%;
    margin: auto;
  }

  .footer-text {
    height: 24px;
    text-align: center;
    width: 100%;
  }
</style>

<div class="hero-section">
  <div class="background-container">
    <div class="background-image"></div>
    <div class="background-overlay"></div>
  </div>
  <div class="content-container">
    <main class="main-content">
      <div class="hero-content">
        <h1 class="hero-title">Adventure Awaits</h1>
        <p class="hero-description">Rent outdoor gear from local owners and save money while exploring the great outdoors.</p>
        <div class="hero-buttons">
          <a href="/browse" class="btn-primary">Browse Gear</a>
          <a href="/list-gear" class="btn-secondary">List Your Gear</a>
        </div>
      </div>

      <section class="section">
        <div class="section-container">
          <h2 class="section-title">Explore Gear Categories</h2>
          <div class="categories-grid">
            <a href="/browse?category=camping" class="category-card">
              <div class="category-image-container">
                <img src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" alt="Camping" class="category-image" />
                <div class="category-overlay"></div>
                <div class="category-content">
                  <h3 class="category-title">Camping</h3>
                  <p class="category-description">Tents, sleeping bags, cooking equipment, and more</p>
                </div>
              </div>
            </a>
            <a href="/browse?category=hiking" class="category-card">
              <div class="category-image-container">
                <img src="https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" alt="Hiking" class="category-image" />
                <div class="category-overlay"></div>
                <div class="category-content">
                  <h3 class="category-title">Hiking</h3>
                  <p class="category-description">Backpacks, footwear, navigation tools, and clothing</p>
                </div>
              </div>
            </a>
            <a href="/browse?category=water-sports" class="category-card">
              <div class="category-image-container">
                <img src="https://images.unsplash.com/photo-1604537466158-719b1972feb8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80" alt="Water Sports" class="category-image" />
                <div class="category-overlay"></div>
                <div class="category-content">
                  <h3 class="category-title">Water Sports</h3>
                  <p class="category-description">Kayaks, paddleboards, surfboards, and life vests</p>
                </div>
              </div>
            </a>
            <a href="/browse?category=biking" class="category-card">
              <div class="category-image-container">
                <img src="https://images.unsplash.com/photo-1511994298241-608e28f14fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" alt="Biking" class="category-image" />
                <div class="category-overlay"></div>
                <div class="category-content">
                  <h3 class="category-title">Biking</h3>
                  <p class="category-description">Mountain bikes, road bikes, helmets, and accessories</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      <section class="how-it-works-section">
        <div class="how-it-works-container">
          <h2 class="section-title">How GearGrab Works</h2>
          <div class="how-it-works-grid">
            <div class="how-it-works-card">
              <div class="how-it-works-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" fill="none" stroke="#16a34a"></path>
                </svg>
              </div>
              <h3 class="how-it-works-title">Find Gear</h3>
              <p class="how-it-works-description">Browse thousands of outdoor gear listings from local owners in your area.</p>
            </div>
            <div class="how-it-works-card">
              <div class="how-it-works-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" fill="none" stroke="#16a34a"></path>
                </svg>
              </div>
              <h3 class="how-it-works-title">Book & Pay</h3>
              <p class="how-it-works-description">Reserve the gear for your dates and pay securely through our platform.</p>
            </div>
            <div class="how-it-works-card">
              <div class="how-it-works-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" fill="none" stroke="#16a34a"></path>
                </svg>
              </div>
              <h3 class="how-it-works-title">Enjoy Outdoors</h3>
              <p class="how-it-works-description">Pick up the gear and enjoy your adventure without the cost of buying.</p>
            </div>
            <div class="how-it-works-card">
              <div class="how-it-works-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" fill="none" stroke="#16a34a"></path>
                </svg>
              </div>
              <h3 class="how-it-works-title">Return & Review</h3>
              <p class="how-it-works-description">Return the gear and share your experience with the community.</p>
            </div>
          </div>
        </div>
      </section>

      <div class="cta-section">
        <div class="cta-content">
          <h2 class="cta-title">Save Money. Reduce Waste. Explore More.</h2>
          <p class="cta-description">Renting gear is better for your wallet and the planet.</p>
        </div>
      </div>

      <section class="testimonials-section">
        <div class="testimonials-container">
          <h2 class="section-title">What Our Users Say</h2>
          <div class="testimonials-grid">
            <div class="testimonial-card">
              <div class="testimonial-header">
                <img src="https://randomuser.me/api/portraits/women/32.jpg" alt="Sarah Johnson" class="testimonial-avatar" />
                <div class="testimonial-info">
                  <h3 class="testimonial-name">Sarah Johnson</h3>
                  <p class="testimonial-location">Denver, CO</p>
                </div>
              </div>
              <p class="testimonial-quote">"GearGrab saved me hundreds of dollars on camping equipment for our family trip. The gear was in perfect condition and the owner was super helpful!"</p>
            </div>
            <div class="testimonial-card">
              <div class="testimonial-header">
                <img src="https://randomuser.me/api/portraits/men/44.jpg" alt="Michael Chen" class="testimonial-avatar" />
                <div class="testimonial-info">
                  <h3 class="testimonial-name">Michael Chen</h3>
                  <p class="testimonial-location">Boulder, CO</p>
                </div>
              </div>
              <p class="testimonial-quote">"As someone who only goes skiing once a year, renting through GearGrab is perfect. I got high-quality equipment for a fraction of the retail price."</p>
            </div>
            <div class="testimonial-card">
              <div class="testimonial-header">
                <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Emily Rodriguez" class="testimonial-avatar" />
                <div class="testimonial-info">
                  <h3 class="testimonial-name">Emily Rodriguez</h3>
                  <p class="testimonial-location">Fort Collins, CO</p>
                </div>
              </div>
              <p class="testimonial-quote">"I love being able to try different kayaks before committing to buying one. GearGrab makes it easy and affordable to test out gear."</p>
            </div>
          </div>
        </div>
      </section>

      <section class="final-cta-section">
        <div class="final-cta-container">
          <h2 class="final-cta-title">Ready to Start Your Adventure?</h2>
          <p class="final-cta-description">Join thousands of outdoor enthusiasts who are saving money and exploring more with GearGrab.</p>
          <div class="final-cta-buttons">
            <a href="/browse" class="btn-cta-primary">Browse Gear</a>
            <a href="/list-gear" class="btn-cta-secondary">List Your Gear</a>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="footer-container">
        <p class="footer-text">© 2025 GearGrab. All rights reserved.</p>
      </div>
    </footer>
  </div>
</div>
