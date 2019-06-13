declare namespace Blog {
  interface Comment {
    _authorId:string;
    _postId:string;
    date:string;
    content:string;
  }
  
  interface Link {
    title:string;
    href:string;
    order:number;
  }
  
  interface Page {
    author:string;
    title:string;
    niceTitle:string;
    date:string;
    content:string;
  }
  
  interface Post {
    author:string;
    title:string;
    niceTitle:string;
    date:string;
    content:string;
  }
  
  interface User {
    role:number;
    email:string;
    username:string;
    password?:string;
  }
}