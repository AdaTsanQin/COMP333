# COMP333
This is for a homework assignment for Wesleyan University, COMP333 Software Engineering.
# Introduction
This is for the first assignment of Wesleyan University, COMP333 Software Engineering.
The website is the landing page of a fictional app: WesDash.

# Teammate and work distribution
Ada Qin: Navigation bar/ Our Strength and Technology/Hyperlink(4)/Style adjustment/Log in 
Haihan Wang: Hero section/ How it works/Style adjustment
Cheruiyot Allan: Customer Reviews/Style adjustment

# Purpose of code
The Code's purpose is to create a landing page for a functional app: WesDash. WesDash is a campus delivery service built for students that is designed to provide fast and easy shopping and delivery services on a university campus. 

# Brief overview
The current repository contains the main page to introduce how WesDash works, including the content of How does app works, the login section, the strength and technology in the app, and the reviews from users, decorated with a hero section, slogan, etc.

The important files are:

index.html: The homepage of the WesDash website. This page contains key features like the navigation bar, hero section, "How It Works", advert slogans, signup form, and customer reviews.

contract.html: A page displaying the contract and terms of service for users of WesDash, including the responsibilities of Buyers, Shoppers, and all Users.

Price_list.html: A page displaying the charging of using the app, including the detailed price and description of different service

styles.css: The main stylesheet used for styling both the main page and contract page, containing a responsive design, color scheme, and layout definitions.

# How to run code

## Locally:
1. Do the following things in the terminal:
   1. `git clone https://github.com/AdaTsanQin/COMP333.git`
   2. `cd COMP333`
2. Do the following things outside of the terminal:
   3. Open the `COMP333` folder and click `index.html` to see the page.

## In the browser:
1. Put this URL in your browser: [https://adatsanqin.github.io/COMP333/](https://adatsanqin.github.io/COMP333/)

# Notification by Ada Qin
Mistakes and actions made while using Github:
1. merge styles.css, login.html, and login_confirm.html into the main branch without a pull request.
2. Part of feature/issue-27 has been changed under HaihanWang's account. The command d50efda bbdead5 d5e961d 74f5128 58f95ee bb2a1a8 is changed by Ada Qin under account 2274006014
3. Because Python as the language was selected when the repo was created at the beginning, redundant files appeared. A line ".ds_store "was added to.gitignore and manually deleted. DS_Store file


## Screenshot of Allan's Xampp
![xampp screenshot](Allan_cheruiyot.png)

## how to run Allan's user review files - create_review.php, update_review.php delete_review.php
Change line 80 in dashboard.html from 
`<a href="update.php">Update Order</a>` to 
`<a href="update_task.php">Update Order</a>`

Now run the following SQL queries:

`
CREATE TABLE `tasks` (
  `task_id` INT(11) NOT NULL AUTO_INCREMENT,
  `request_id` INT(11) DEFAULT NULL,
  `username` VARCHAR(255) DEFAULT NULL,
  `dashername` VARCHAR(255) DEFAULT NULL,
  `item` TEXT,
  `status` VARCHAR(50) DEFAULT NULL,
  `rating` INT(11) DEFAULT NULL,
  `comment` TEXT,
  PRIMARY KEY (`task_id`)
)
`

Now you can add, update, and delete reviews after an order is dropped. Use the Manage Reviews tab.


## Assignment-2
People who register the program can log in and out of the program repeatedly.
As a Buyer, the user can request someone to run errands for him: create a new order, fill in the detailed product name and address in the order, and always check whether someone has accepted the order and whether it has been delivered. There will be a prompt when the order is delivered. After confirming the items, the Buyer ends the order.
At the same time, as a Runner, you can also view the currently accepted orders, accept the orders, and send them to the Buyer at a certain time.
# Work distrubution
Ada: register/ request of Buyer / request of Runner / Readme / deployment in infinityfree
Haihan: Login/read order list/ update order list/
Allan: create,update,delete reviews/ Dashboard page
# How to set up app
1. in local MySQL, create a database called app-db
2. Do following in this URL 
http://localhost/phpmyadmin/index.php
Click on database in navigation bar
Under create database enter app-db in the "Database name"
click to get into app-db
go to SQL in navigationbar, copy the following code into it and click go:
CREATE TABLE users (
    username VARCHAR(255) NOT NULL PRIMARY KEY,
    password VARCHAR(255) DEFAULT NULL
);
CREATE TABLE requests (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    item VARCHAR(255) NOT NULL,
    drop_off_location VARCHAR(255) NOT NULL,
    delivery_speed ENUM('urgent', 'common') DEFAULT 'common',
    status ENUM('pending', 'accepted', 'completed', 'confirmed') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL,
    accepted_by VARCHAR(255) DEFAULT NULL,
    INDEX (username)
);
3. Go to the URL : http://localhost/register.php 
then test the code

# URL(infinityfree)
ada-qin.ct.ws not done but tried to set up the SSL
Having following :
Installed SSL Status
This is the SSL certificate that's installed on your hosting account.

Status	
Issuer	Google Trust Services
Expires at	2025-06-05


# local enviornment
1.Ada:
![Ada's local enviornment](Ada_local.jpg)

