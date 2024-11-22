import fs from 'fs';

class LevelHandler {
    constructor() {
        this.staticLevel = {};
        this.level = {};
    }

    readLevel() {
        try {
            const level = JSON.parse(fs.readFileSync('./input/level.vgd', 'utf8'));
            this.level = level;
            this.staticLevel = level; // Copy of the original to monitor changes

        } catch (oops) {
            console.error('No valid level file!');
            process.exit(1);
        }
        return this.level;
    }
    
    writeBackup(level) {
        if (!level) { level = this.staticLevel };
        
        fs.writeFileSync("./output/level-backup.vgd", JSON.stringify(level), function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("Backup created");
        });
    }
    
    writeLevel(level) {
        if (!level) {
            level = this.level;
        }

        fs.writeFileSync("./output/level.vgd", JSON.stringify(level), function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("Level written!");
        }); 
    }
    
    makeId() {
        const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890()[]{}/?<>".split("")
        var string = ""
        for (var i = 0; i < 10; i++) {
            string += alphabet[Math.round(Math.random()*(alphabet.length-1))]
        }
        return string
    }
    
    spaceOutSpawnTimes(objects) {
        // TODO
    }
    
    filterDuplicates(arr){
        var tmp = [];
        for(var i = 0; i < arr.length; i++){
            if(tmp.indexOf(arr[i]) == -1){
            tmp.push(arr[i]);
            }
        }
        return tmp;
    }
}

export default LevelHandler;