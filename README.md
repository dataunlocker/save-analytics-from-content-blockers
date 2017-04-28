# Save Analytics From Content Blockers

A repository with demo application for my Medium article "Save Your Analytics from Content Blockers"
(will be released soon).

You can use modified analytics script directly from GitHub pages (until it appears in ad-blockers 
filter):

```html
<script>
    (function(i,s,o,r){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date()})(window,document,'script','ga');
    ga('create', 'UA-12345678-1', 'auto'); // replace this tracking code with your one
    ga('send', 'pageview');
</script>
<script src="https://zitros.github.io/save-analytics-from-content-blockers/analytics.js" async></script>
```

Testing
-------

Having latest [NodeJS and NPM](https://nodejs.org) installed, run the server with the following 
command:
 
```bash
npm install
npm run start
```

Now go to the printed link.