pragma solidity ^0.4.19;

contract Escrow {
    address buyer;
    address seller;
    string public productName;
    uint timestamp;
    bool public buyerOK = false;
    bool public sellerOK = false;

    event refund();
    event completed();

    
    function Escrow(address _seller, address _buyer, string _productName) public payable {
        buyer = _buyer;
        seller = _seller;
        productName = _productName;
        timestamp = now;
    }

    function getEscrowInfo() view public returns(string,uint,bool,bool) {
        return (productName,this.balance,buyerOK,sellerOK);
    }

    function contractValue() view public returns (uint) {
        return this.balance;
    }
    
    function accept() public {
        require(msg.sender == buyer || msg.sender == seller);
        if (msg.sender == buyer) {
            buyerOK = true;
        } else {
            sellerOK = true;
        }
        
        if (buyerOK == true && sellerOK == true) {
            seller.transfer(this.balance);
            completed();
        }
    }


    function reject() public {
        require(msg.sender == buyer || msg.sender == seller);
        if (msg.sender == buyer) {
            buyerOK = false;

        } else {
            sellerOK = false;
        }
        if (buyerOK == false && sellerOK == false) {
            buyer.transfer(this.balance);
            refund();
        }
    }
}


contract Store {
    enum ProductStatus { Available, Sold, OutOfStock }
    struct Product {
        uint id;
        string name;
        string category;
        string imageLink;
        string desc;
        uint price;
        ProductStatus status;
    }

    event escrowIsCreated(address escrowAddress);


    address owner;
    Product[] public productList;
    Product public currentProduct;
    string[] productCategory;
    mapping(string => uint) productQuantity;
    mapping(address => mapping(uint => Product)) stores;
    mapping(uint => address) productIDInStore;
    uint public productIndex;

    function Store() public {
        productIndex = 0;
    }

    function addProduct(string _name, string _category, string _imageURL, string _desc, uint _price) public {
        productIndex += 1;
        Product memory product = Product(productIndex, _name, _category, _imageURL, _desc, _price, ProductStatus.Available);
        stores[msg.sender][productIndex] = product;
        productList.push(product);
        productCategory.push(_category);
        // addCategory(_category);
        productIDInStore[productIndex] = msg.sender;
    }

    
    function addCategory(string category) public {
        uint categoryLength = 0;
        for (uint i = 0; i < productCategory.length; i++) {
            if (compareStrings(category,productCategory[i])) {
                categoryLength++;
            }
        }
        if (categoryLength == 0 ) {
            productCategory.push(category);
        }
    }

    function getCategory(uint index) view public returns (string) {
        return productCategory[index];
    }

    function getCategoryLength() view public returns (uint) {
        return productCategory.length;
    }

    function buyProduct(string productName, address buyer) public payable{
        getProductBy(productName);
        address seller = productIDInStore[currentProduct.id];
        address escrowAddress = address((new Escrow).value(msg.value)(seller, buyer, productName));
        
        escrowIsCreated(escrowAddress);
    }

    function getProductBy(string name) public {
        for(uint i = 0; i < productList.length; i++) {
            if (compareStrings(productList[i].name,name)) {
                currentProduct = productList[i];
            }
        }
    }

    function getProduct(uint id) view public returns (uint, string,string,string,string, uint, ProductStatus){
        Product memory product = stores[productIDInStore[id]][id];
        return (product.id, product.name, product.category, product.imageLink, product.desc, product.price, product.status);
    }
    function getProductQuantity() view public returns(uint){
        return productList.length;
    }



    function compareStrings (string a, string b) internal view returns (bool){
        return keccak256(a) == keccak256(b);
    }


    function checkProductAvailable() public {

    }


    function kill() public {
        if(msg.sender == owner) selfdestruct(owner);
    }

}

