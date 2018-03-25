var StoreLib = artifacts.require("./StoreLib.sol");
var Escrow = artifacts.require("Escrow");
var Store = artifacts.require("Store");

module.exports = function(deployer) {

  deployer.deploy(Store);
};
