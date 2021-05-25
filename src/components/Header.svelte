<script>
  import { likeCount } from '../store/store';

  export let toggleTheme = false;

  function handleIcon() {
    toggleTheme = !toggleTheme;
    console.log(toggleTheme);
  }
</script>

<header class="Header">
  <div class="Header-container">
    <div class="Header-content">
      <div class="Header-logo">
        <img src="favicon.png" alt="logo">
      </div>
      <div class="Header-nav">
        <ul>
          <!-- {#if toggleTheme}
            <li><i class="fas fa-lightbulb" on:click={handleIcon}></i></li>
          {:else}
            <li><i class="far fa-lightbulb" on:click={handleIcon}></i></li>
          {/if} -->
          <li>{$likeCount === 0 ? '' : $likeCount}<i class="fas fa-heart" /></li>
          <li><i class="fas fa-user-alt" /></li>
        </ul>
      </div>
    </div>
  </div>
</header>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap');

  .Header {
    background: rgba(250, 250, 250, .5);
    position: fixed;
    width: 100%;
    z-index: 100;
  }
  .Header-container {
    grid-template-columns: minmax(auto, 936px);
    display: grid;
    justify-content: center;
    border-radius: 0 0 var(--radius-low) var(--radius-low);
    background: var(--white-low);
    box-shadow: var(--shadow-med);
    padding: 0 2em;
  }
  .Header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .Header ul {
    list-style: none;
  }
  .Header li {
    display: inline-block;
    margin: 0 0 0 1em;
  }
  .Header i {
    font-size: 16px;
    color: rgba(38, 38, 38, 0.7);
    cursor: pointer;
  }
  .Header-logo img {
    height: 2.5em;
    /* filter: drop; */
    filter: drop-shadow(-1px 1px 2px gray);
  }

  @media screen and (max-width: 768px) {
    .Header-container {
      border-radius: 0;
    }
  }
</style>


