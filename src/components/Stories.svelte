<script>
  import Storie from "./Storie.svelte";

  export let stories = false;

  function handleStories() {
    stories = !stories;
  }
</script>

<div class="Stories">
  <div class="Stories-container"
  class:show-stories={stories}>
    <div class="Stories-head">
      <h2>Stories</h2>
      <span>See all</span>
    </div>
    <Storie username='Uzumaki.404' avatar='../../img/uzumaki.404.jpg' time='17 hours' />
    <Storie username='Dead_Cool' avatar='../../img/dead_cool.jpg' time='24 minutes' />
    <Storie />
    <Storie username='Me' avatar='https://avatars.githubusercontent.com/u/77276651?v=4' time='now' />
  </div>
  <div class="Stories-responsive">
    <i class="fas fa-history"
      class:active={stories}
      on:click={handleStories}></i>
  </div>
</div>

<style>
  .Stories {
    margin: 1em 0;
    padding: 0.5em 1em;
    background: var(--white-low);
    box-shadow: var(--shadow-low);
    border-radius: var(--radius-low);
  }
  .Stories-responsive {
    display: none;
  }
  .Stories-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5em 0 0 0;
  }
  .Stories-head h2 {
    font-size: 12px;
    font-weight: 600;
  }
  .Stories-head span {
    font-size: 12px;
    font-weight: normal;
    color: black;
  }
  @media screen and (max-width: 768px) {
    .Stories {
      padding: .5em;
      position: fixed;
      bottom: 0;
      left: 1%;
    }
    .Stories-responsive {
      display: initial;
    }
    .active {
      transition: .3s;
      color: var(--pink-color);
    }
    .Stories-container {
      display: none;
    }
    .show-stories {
      display: initial;
    }
  }
</style>