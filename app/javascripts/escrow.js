// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';
const ipfsAPI = require('ipfs-api');
const ethUtil = require('ethereumjs-util');

const ipfs = ipfsAPI({host: 'localhost', port: '5001', protocol: 'http'});
// Import our contract artifacts and turn them into usable abstractions.
import store_artifacts from '../../build/contracts/Store.json';
import escrow_artifacts from '../../build/contracts/Escrow.json';
// MetaCoin is our usable abstraction, which we'll use through the code below.
var Store = contract(store_artifacts);
var Escrow = contract(escrow_artifacts);
var getUrlParameter = function getUrlParameter(sParam) {
  var sPageURL = decodeURIComponent(window.location.search.substring(1)),
      sURLVariables = sPageURL.split('&'),
      sParameterName,
      i;

  for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');

      if (sParameterName[0] === sParam) {
          return sParameterName[1] === undefined ? true : sParameterName[1];
      }
  }
};
var escrowAddress = getUrlParameter('eAddess');
window.App = {
  start: function() {
    var self = this;
    // Bootstrap the MetaCoin abstraction for Use.
    let provider = new Web3.providers.HttpProvider("http://localhost:9545");
    Store.setProvider(provider);

    console.log('escrow: ',escrowAddress);
  },
};
async function loadEscrow(address){
  console.log('Starting to load Escrow');
  let escrowContract = Escrow.at(address);
  let value = escrowContract.contractValue();
  $("#escrow-content").append(buildProduct(product));
  let value = `<div id=>`;
  console.log("value of escrow: ", value);

}
window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
  }

  App.start();
});

$(document).on("click", ".buyProduct", function(){
  let productName = $(this).attr("id");
  console.log(productName);
  buyProduct(productName);
});

$(document).on("click", ".goURL", function(){
  window.location = '/escrow?eAddess=';
});