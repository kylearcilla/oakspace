<script lang="ts">
    import Header from './Header.svelte'
    import Main from './Main.svelte'
    import Footer from './Footer.svelte'
</script>

<svelte:head>
	<title>Oakspace: A Framework for Intentional Living</title>
	<meta content="width=device-width, initial-scale=1" name="viewport" />
	<meta
		name="description"
		content="A Framework for Intentional Living for goals, habits, routines and more."
	/>
	<meta name="keywords" content="productivity, journal, bullet journal, planner, goals, habits, routines, workspace, todo, tasks" />
	<meta name="author" content="OakSpace" />
	<meta name="og:title" content="OakSpace" />
	<meta
		name="og:description"
		content="A Framework for Intentional Living for goals, habits, routines and more."
	/>
	<meta property="og:site_name" content="OakSpace" />
	<meta property="og:url" content="https://oakspace.app" />
	<link rel="icon" href="/favicon.png" title="A Framework for Intentional Living" />
	<link rel="apple-touch-icon" href="/favicon.png" />
	<link rel="shortcut icon" href="/favicon.png" type="image/png" />
    <link href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@oakspace" />
	<meta
		name="twitter:description"
		content="A Framework for Intentional Living for goals, habits, routines and more."
	/>
	<meta name="twitter:title" content="OakSpace" />
</svelte:head>

<div 
    class="main"
>
    <Header />
    <Main />
    <Footer />
</div>

<style lang="scss">
    .main {
        --dot-spacing: 18px;

        background-color: #F9F3E7;
        min-height: 100vh;
        min-width: 100vw;
        background-repeat: repeat;
        background-image: url('data:image/svg+xml,<svg opacity="0.2" xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="1" cy="1" r="0.5" fill="%23898276"/></svg>');
        background-size: var(--dot-spacing) var(--dot-spacing);
        background-position: 0 0;
        
        &__logo {
            font-size: 24px;
            font-weight: 700;
        }
    }
</style>
