# Save Analytics From Content Blockers

This is a repository with demo application code for [my Medium article "Save Your Analytics from Content Blockers"](https://medium.com/@zitro/save-your-analytics-from-content-blockers-7ee08c6ec7ee).

You can use modified analytics script directly from GitHub pages (until it appears in ad-blockers filters :smile:):

```html
<script>
    (function(i,s,o,r){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date()})(window,document,'script','ga');
    ga('create', 'UA-12345678-1', 'auto'); // replace this tracking code with your one
    ga('send', 'pageview');
</script>
<script src="https://zitros.github.io/save-analytics-from-content-blockers/analytics.js" async></script>
```

Running the Example
-------------------

Having the latest [NodeJS and NPM](https://nodejs.org) installed, run the server with the following command:
 
```bash
npm install
npm run start
```

Then go to the printed link. To explore the example completely, you need **static IP address** at least.

UPDATE IS COMING
----------------

As of 3/14/2019, I've developed a more robust solution for Google Analytics / Google Tag Manager, which also comes with URL masking and advanced on-the-fly transformations for everything that may've been blocked by ad blockers. I'll give it a go soon. You can subscribe to [my GitHub](https://github.com/ZitRos) / [Medium](https://medium.com/@zitro) to stay tuned.
