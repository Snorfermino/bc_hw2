// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';
const ipfsAPI = require('ipfs-api');
const ethUtil = require('ethereumjs-util');

const ipfs = ipfsAPI({host: 'localhost', port: '5001', protocol: 'http'});

import store_artifacts from '../../build/contracts/Store.json';
import escrow_artifacts from '../../build/contracts/Escrow.json';

var Store = contract(store_artifacts);
var Escrow = contract(escrow_artifacts);

window.App = {
  start: function() {
    var self = this;

    let provider = new Web3.providers.HttpProvider("http://localhost:9545");
    Store.setProvider(provider);
    Escrow.setProvider(provider);
    var reader;


    Store.deployed().then(function (instance) {
      setupCategoryFilter(instance);
      var createdEvent = instance.escrowIsCreated();
      createdEvent.watch(function (err, res) {
        
        // Interact with the newly escrow contract here.
        let address = res.args.escrowAddress;
        loadEscrow(address);
        console.log('watcher escrow is created at:', address);


      });
    });

      $('#product-image').on('change', function (event) {
        const file = event.target.files[0];
        reader = new window.FileReader();
        console.log('file',file);
        reader.readAsArrayBuffer(file);
      });
      $("#add-product-form").submit( function (e){
        e.preventDefault();
        console.log('File Reader', reader);
        saveProduct(reader, $('#product-name').val());
      });
      $(".buyProduct").on('click', function(){
        // Holds the product ID of the clicked element
        console.log("clicked");
        var productId = $(this).attr('id');
        alert(productId);
      });
      loadProduct('');

    
  },
};

async function saveProduct(fileReader, productName){
  console.log('filereader', fileReader);
  let response = await saveImageOnIpfs(fileReader);
  console.log('response from ipfs', response);
  let imageID = response[0].hash;
  // Add Product
  let instance = await Store.deployed();
  let res = await instance.addProduct(productName,'cat',imageID,'desc',web3.toWei(1,"ether"), {from: web3.eth.accounts[0], gas: 470000});
  alert('Product Added!');
}

function saveImageOnIpfs(filereader){
  console.log('saveIPFS',filereader.result);
  const buffer = Buffer.from(filereader.result);
   ipfs.add(buffer, (err,res) => {
    if (err || !res) {
      console.log('err',err);
    } else {
      console.log('result: ',res);
    }
  }); 
  return null;
}

function buildProduct(p) {
  let price = web3.fromWei(p[5], 'ether');
  return `
  <div class="row carousel-row">
        <div class="col-xs-8 col-xs-offset-2 slide-row">
            <div id="carousel-1" class="carousel slide slide-carousel" data-ride="carousel">
              <!-- Indicators -->
              <ol class="carousel-indicators">
                <li data-target="#carousel-1" data-slide-to="0" class="active"></li>
              </ol>
            
              <!-- Wrapper for slides -->
              <div class="carousel-inner">
                <div class="item active">
                    <img src="http://localhost:8080/ipfs/${p[3]}" alt="Image">
                </div>
              </div>
            </div>
            <div class="slide-content">
                <h4>${p[1]}</h4>
                <p>
                    ${p[4]}
                </p>
            </div>
            <div class="slide-footer">
                <span class="pull-right buttons">
                    <div class="btn btn-sm btn-default productPrice" id="${p[1]}-price"><i class="fa fa-fw fa-bitcoin"></i> ${price}</div>
                    <button class="btn btn-sm btn-primary buyProduct" id="${p[1]}" value=${p[5]} ><i class="fa fa-fw fa-shopping-cart"></i> Buy</button>
                </span>
            </div>
        </div>
    </div>
  `;
}

async function buyProduct(productName,productPrice){
  let instance = await Store.deployed();
  console.log('err',web3.eth.accounts[0]);
  let res = await instance.buyProduct( productName , web3.eth.accounts[0],{from: web3.eth.accounts[0], gas: 570000, value: productPrice });
}
async function loadProduct (catFilter) {
  console.log('Starting to load products');
  let instance = await Store.deployed();
  let productQuantity = await instance.getProductQuantity().then(function(length){
    console.log('product quantity:', length.toNumber());
    return length.toNumber();
  });
  $("#product-list").html('');
    for(var i = 1; i <= productQuantity;i++){
      let product = await instance.getProduct(i);
      if (catFilter.toLowerCase() === '') {
        $("#product-list").append(buildProduct(product));
      } else  {
        if (product[2].toLowerCase() === catFilter.toLowerCase()) {
          $("#product-list").append(buildProduct(product));
        }
      }
      
    }

}
async function loadEscrow (address) {
  console.log('Starting to load Escrow');
  let escrowContract = Escrow.at(address);
  var completedEvent = escrowContract.completed();
  completedEvent.watch(function (err, res) {
  
    $("#escrowStatus").text("Completed");

  });

  var refundEvent = escrowContract.completed();
  refundEvent.watch(function (err, res) {
  
    $("#escrowStatus").text("Cancelled");

  });
  let escrowInfo = await escrowContract.getEscrowInfo();
  var buyer = (escrowInfo[2]) ? 'YES' : 'NO';
  var seller = (escrowInfo[3]) ? 'YES' : 'NO';
  
  var html =   `<div class="row carousel-row">
  <div class="col-xs-8 col-xs-offset-2 slide-row">
          <h4> Contract Balance: ${web3.fromWei(escrowInfo[1], 'ether')} Ether</h4>
          <ul class="list-group">
            <li class="list-group-item">Buyer Status:  ${buyer}</li>
            <li class="list-group-item">Seller Status: ${seller}</li>
            <li class="list-group-item" id="escrowStatus">Pending</li>
          </ul>
  </div>
</div>`;

  $("#escrow-content").append(html);

}

async function setupCategoryFilter (instance) {
  var list = '';
  let categoriesLength = await instance.getCategoryLength().then(function(length){
    console.log('product categories:', length.toNumber());
    return length.toNumber();
  });

  for(var i = 0; i <= categoriesLength - 1;i++){
    let category = await instance.getCategory(i);
    list += '<li><a href="#" class="categoryFilter" id="'+ category +'">' + category + '</a></li>';
  }
  console.log(categoriesLength);
  $('#category').append(list);
  // $('#productCategory').click ( function (e) {
    
  //   e.preventDefault();
  // });
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
  let price = $(this).attr('value');
  buyProduct(productName,price);
});

$(document).on("click", ".categoryFilter", function(){
  let category = $(this).attr("id");
  loadProduct(category);
  console.log('category', category);
});