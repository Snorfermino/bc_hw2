pragma solidity ^0.4.17;

library StoreLib{
    enum ProductStatus { Available, Sold, OutOfStock }
    struct Product {
        string name;
        string category;
        string imageLink;
        string descLink;
        uint price;
        address seller;
        ProductStatus status;
    }
}
