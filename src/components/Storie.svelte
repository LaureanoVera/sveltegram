<script>
  export let username = 'Anonymous';
  export let avatar =  '../../img/anonymous.jpg';
  export let time = '-----';
</script>

<div class="Stories-items">
  <div class="Stories-item">
    <div class="Stories-item-box">
      <img src={avatar} alt={username}>
    </div>
    <h2>{username} <span>{time}</span></h2>
  </div>
</div>

<style>
  .Stories-item img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }
  .Stories-item {
    display: flex;
    align-items: center;
    margin: 0 0 0.5em 0;
  }
  .Stories-item h2 {
    font-size: 14px;
    color: black;
    margin: 0 0 0 0.5em;
  }
  .Stories-item h2 span {
    display: block;
    font-size: 9px;
    text-transform: uppercase;
    color: gray;
  }
  .Stories-items {
    margin: 0.5em 0 0.5em 0;
  }
  .Stories-item-box {
    width: 32px;
    height: 32px;
    border: double 2px transparent;
    border-radius: 100%;
    background-image: linear-gradient(#fff, #fff),
      radial-gradient(circle at top left, #f09433, #bc1888);
    background-origin: border-box;
    background-clip: content-box, border-box;
  }
</style>