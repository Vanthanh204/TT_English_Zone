const db = require("./db");

(async()=>{

    try{

        const conn=await db.getConnection();

        console.log("Connected MySQL");

        conn.release();
        
        // Đóng pool để kết thúc tiến trình Node.js
        await db.end();

    }catch(err){

        console.error(err);
        process.exit(1);

    }

})();