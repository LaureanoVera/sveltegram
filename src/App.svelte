<script>
	import { onMount } from 'svelte';
	import Header from './components/Header.svelte';
	import Main from './components/Main.svelte';
	import TimeLine from './components/TimeLine.svelte';
	import Sidebar from './components/Sidebar.svelte';

	export let toggleTheme;
	export let darkMode = toggleTheme;

	let data = {};
	const API = 'https://us-central1-pugstagram-co.cloudfunctions.net/data';

	onMount(async () => {
		const response = await fetch(API);
		data = await response.json();
	});
</script>


<Header {toggleTheme} />
<Main {darkMode}>
	<TimeLine posts={data.posts} />
	<Sidebar {...data.user} />
</Main>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap');

	:global(body) {
		background-color: #fafafa;
		color: rgba(38, 38, 38, .7);
		font-family: "Lato", sans-serif;
		margin: 0;
		padding: 0;
	}

	:global(h1, h2, h3) {
		margin: 0;
		padding: 0;
	}

	:global(:root) {
		--pink-color: #F29BAB;
		--lightblue: #6A8FD9;
		--shadow-low: 0 0 2px var(--pink-color), 0 0 3px var(--lightblue);
		--shadow-med: 0 0 3px var(--pink-color), 0 0 5px var(--lightblue);
		--white-low: rgba(250, 250, 250, .75);
		--black-low: rgba(25, 25, 25, .75);
		--radius: 1em;
		--radius-low: .5em;
	}
</style>