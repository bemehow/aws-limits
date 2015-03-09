// modules
var utils = require('utils');

// make casper instance global 
casper = require('casper').create({
    timeout: 100000,
    waitTimeout: 100000,
    verbose: false, 
    logLevel: 'info',
    pageSettings: {
         userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.94 Safari/537.4'
    }
});

var account  = casper.cli.get('account')
var username = casper.cli.get('username')
var password = casper.cli.get('password')
var loginUrl = casper.cli.get('loginUrl') 
var limitsInitialUrl = "https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#Limits:";

// login
casper.start(loginUrl);

casper.thenOpen(limitsInitialUrl);

casper.waitForSelector('form#signin_form', function() { 
  this.wait(3000); //sleep to be sure the form is visible
  this.fill('form#signin_form', {account: account, username: username, password: password}, true);
});

// regional limits
var regions = ['us-east-1', 'us-west-2', 'us-west-1', 'eu-west-1', 'sa-east-1', 'eu-central-1', 'ap-southeast-2', 'ap-southeast-1', 'ap-northeast-1'];
var globalLimits = {}
var limitsUrl; 

regions.forEach(function(region, index, regions){
    limitsUrl = 'https://console.aws.amazon.com/ec2/v2/home?region='+region+'#Limits:'; 
    //utils.dump(limitsUrl);
    casper.thenOpen(limitsUrl);

    //TODO: make sure the "last" element is waited for not to miss any data from the rows (td)
    //or add static waiting time as a precaution
    //casper.waitForSelector('td.PS.EU div.gwt-Label', function() {
    casper.waitForText('Launch configurations', function() {
      var table = this.evaluate( function() {
        var tableRows = document.querySelectorAll('tr');
        return Array.prototype.map.call(tableRows, function(e) {
             return e.textContent;
        });
      });

      var regionLimits = this.evaluate( function() {
        var tableRows = document.querySelectorAll('tr');
        var d = {};
        for ( var i = 0; i< tableRows.length; i++) {
           key = tableRows[i].children[0]
           value = tableRows[i].children[1]
           if (!(/nbsp/.test(value.innerHTML)) && (!(/ /.test(value.textContent))) && (!/Name/.test(key.textContent))) {
                d[key.textContent.trim().toLowerCase().split(' ').join('-')] = value.textContent.replace(',','');
           };
        };
        return d;
      });
     globalLimits[region] = regionLimits;
    });
    return globalLimits;
});

casper.then(function(){
    utils.dump(globalLimits);
});


casper.run();

