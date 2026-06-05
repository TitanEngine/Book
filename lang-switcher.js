// Force default theme to "rust" for new sessions
if (!sessionStorage.getItem('theme-forced-rust')) {
    try {
        localStorage.setItem('mdbook-theme', 'rust');
        sessionStorage.setItem('theme-forced-rust', 'true');
    } catch(e) {}
    const html = document.documentElement;
    if (html) {
        html.classList.remove('light', 'coal', 'navy', 'ayu');
        html.classList.add('rust');
    }
}


// Pre-configure MathJax to hide loading/processing messages and setup delimiters
window.MathJax = window.MathJax || {};
window.MathJax.messageStyle = "none";
window.MathJax.showProcessingMessages = false;
window.MathJax.tex2jax = window.MathJax.tex2jax || {};
window.MathJax.tex2jax.inlineMath = window.MathJax.tex2jax.inlineMath || [['$', '$'], ['\\(', '\\)']];
window.MathJax.tex2jax.processEscapes = true;

let mathjaxConfigured = false;

function ensureMathJaxConfigured() {
    if (mathjaxConfigured) return;
    if (window.MathJax && window.MathJax.Hub) {
        window.MathJax.Hub.Config({
            messageStyle: "none",
            showProcessingMessages: false,
            tex2jax: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                processEscapes: true
            }
        });
        mathjaxConfigured = true;
    }
}

// Dictionary of detailed deep dive content for each keyword in Hinglish, English, and Spanish
const keywordDeepDives = {
    hinglish: {
        collision: {
            title: "Collision (Takraar)",
            content: `Collision kya hai in real? Real world me, agar koi cup floor par gire to physical matter use physically rok deta hai. But computer ke andar? Wahan koi physical matter nahi hota. Ye bas ek khali digital space hai. To game engine ko kaise pata chalta hai ki do cheezein touch hui? Har object ke paas ek invisible 3D math boundary hoti hai jise hum collider bolte hain. Har ek frame me engine har collider ke X, Y, aur Z coordinates ko check karta hai.<br><br>Jab Climber B1 ki boundary cliff wall ki boundary ke sath overlap karti hai, tab engine ek red flag generate karta hai jise intersection bolte hain. Par ye wahin nahi rukta. Engine fauran is overlap ka exact mathematical center nikalta hai, jise contact point kehte hain. Fir, ye ek normal bounce impulse fire karta hai jo ki bas ek instant digital force ka spike hota hai jo objects ko 90-degree angle par push karke alag karta hai taaki wo ek dusre ke paar na nikal jayein.`
        },
        penetration: {
            title: "Penetration (Overlap/Sinking)",
            content: `Penetration tab hoti hai jab do physical bodies ek dusre ke andar overlap ho jati hain. Real life me physics atoms ko ek hi space occupy karne se rokti hai. But computers me ye rule automatically nahi hota. Game to bas har 1/60th second me character ki position update karta hai. Agar B1 cliff ki taraf bohot tez gir raha hai, to frame 1 me wo cliff se ek foot door hoga aur frame 2 me wo solid rock ke 3 inch andar chala jayega. Isi ko penetration bolte hain.<br><br>Engine ne contact ka exact moment miss kar diya. To deewar ke andar phase hue character ko kaise theek karein? Hum use karte hain Baumgarte positional corrections. Sunne me complex lagta hai, par ye bas ek digital measuring tape hai. Engine measure karta hai ki B1 kitna andar tak ghusa hai. Agar wo 3 inch andar hai, to engine uske position coordinates ko rewrite karke use 3 inch piche reset kar deta hai taaki wo rock ki surface par wapas aa jaye.`
        },
        friction: {
            title: "Friction (Ragar)",
            content: `Jab ek dynamic object kisi surface (jaise Climber B1 deewar) par pressed hota hai, to wo instantly niche slip kyu nahi hota? Ye friction (ragar) ki force ki wajah se hota hai. Friction koi aisa force nahi hai jo aapko wall se door push kare. Ye ek resistive force hai jo surface ke tangentially (sideways) lagta hai aur sliding ko oppose karta hai. Ise hum tangential constraint impulse bolte hain.<br><br>Lekin B1 ki grip infinite to nahi hai na? Agar uspar bohot zyada weight daal doge, to wo gir jayega. Engine is breaking point ko Coulomb's Law se control karta hai, jo ki formula \\(f_t \\le \\mu f_n\\) hai. Iska matlab hai ki sideways lagne wala holding force (\\(f_t\\)) kabhi bhi wall ke grip multiplier (\\(\\mu\\)) multiplied by B1 ko rock me kitna push kiya ja raha hai (\\(f_n\\)) se bada nahi ho sakta. Agar gravity is limit se zyada niche khinchegi, to engine use slip hone dega.`
        },
        joints: {
            title: "Articulated Joints (Jod)",
            content: `Articulated joints tab use hote hain jab multiple bodies physical connection me hoti hain, jaise jab Climber B1 kisi dusre climber ko pakad kar chain banata hai. Engine ko kaise pata chalta hai ki wo aapas me connected hain? Wo joints constraints ka use karta hai. Normally ek 3D object ke paas poori freedom hoti hai ki wo left, right, up, down move kare ya rotate kare. Articulated joint ka matlab hai ki engine un freedoms ko chheen leta hai. Ye ek hardcoded rule hota hai jo do bodies ko lock kar deta hai.<br><br>Jab B1 B2 ka haath pakadta hai, to engine ek strict distance constraint banata hai jo computer ko batata hai ki "ye do math coordinates kabhi bhi zero inch se zyada door nahi ho sakte." Agar B1 ka coordinate upar jayega, to engine B2 ke coordinate ko bhi forcefully upar khinchega taaki wo independent floating boxes ki tarah behave karne ke bajaye ek connected hanging chain ki tarah behave karein.`
        },
        x_i: {
            title: "Target State \\(x_i^{(k+1)}\\)",
            content: `Equation me \\(x_i^{(k+1)}\\) target state ko represent karta hai, jo ki final converged position ya velocity hoti hai jahan Climber B1 ko move hona hai. Lekin Box2D ya Nvidia PhysX jaise game engine ke andar, ye sirf koi ek magic number nahi hota. Engine ise <code>accumulatedImpulse</code> naam ke variable me store karta hai.<br><br>B1 par ek frame me ek single explosive jolt lagane ke bajaye, engine loops me chote-chote micro-pushes ko add karta jata hai. Engine RAM me is <code>accumulatedImpulse</code> ki limit ko physically clamp kar deta hai. Agar force zyada ho jaye, to engine ise cap kar deta hai taaki B1 ki body glitch karke map ke paar na chali jaye. Yahan \\(k+1\\) ka matlab hai ki engine updated impulse ko current active memory address me write kar raha hai.`
        },
        a_ii: {
            title: "Diagonal Matrix Element \\(a_{ii}\\)",
            content: `Diagonal matrix element \\(a_{ii}\\) physical body ke mass aur rotational inertia ko represent karta hai, yaani ye batata hai ki B1 movement ke khilaf kitna stubborn (resistant) hai. Par game engines sirf pure mass use nahi karte. C++ physics code me ise <code>effectiveMass</code> ki tarah calculate kiya jata hai.<br><br>Aisa kyu? Kyunki isse farq padta hai ki forces exactly <i>kahan</i> pull kar rahi hain. Agar upar wala climber B1 ki wrist pakadta hai, to <code>effectiveMass</code> ki calculation bilkul alag hogi usse jab wo B1 ko chest ke center se pakadta hai. Engine B1 ka raw weight lotta hai, contact point ke exact pixel location par cross-product matrix run karta hai, aur <code>effectiveMass</code> nikalta hai. Aur CPU ko slow division math se bachane ke liye, engine inverse (\\(1/a_{ii}\\)) ko pehle hi calculate kar leta hai.`
        },
        b_i: {
            title: "Bias Vector Element \\(b_i\\)",
            content: `Bias vector element \\(b_i\\) raw, uncorrected external force hai, jaise gravity jo Climber B1 ko niche khinch rahi hai. Game engine me ise <code>biasRate</code> ya <code>positionImpulse</code> naam ke variable se handle kiya jata hai.<br><br>Engine screen par visual error ko measure karta hai. Kya B1 ka arm joint visually do inch stretch ho gaya hai? Engine us do-inch ke error ko stiffness factor se multiply karke mathematical force me badal deta hai. Ye force solver ko force karta hai ki wo B1 ko wapas sahi jagah pull kare.`
        },
        sum_t: {
            title: "Resolved Summation \\(\\sum_{j=1}^{i-1} a_{ij} x_j^{(k+1)}\\)",
            content: `Resolved summation \\(\\sum_{j=1}^{i-1} a_{ij} x_j^{(k+1)}\\) un constraints aur body elements ke pull ko represent karta hai jinka math current frame iteration me already solve ho chuka hai (jaise B1 ke upar wale climbers jo use upar pull kar rahe hain). CPU me code ek strict top-to-bottom <code>for</code> loop me chalta hai. B1 ke upar wale climbers (T1, T2, T3) memory array me pehle aate hain. CPU unka math is frame ke liye solve kar chuka hai. Isliye B1 ko calculate karte waqt, engine unki updated <code>linearVelocity</code> ko seedhe L1 Cache se read kar leta hai.<br><br>Game engines yahan <code>warm starting</code> trick ka use karte hain. Wo pichle frame ke exact tension forces ko seedhe current frame me feed kar dete hain, jisse CPU ko chain solve karne ke liye ek bada head start mil jata hai.`
        },
        sum_b: {
            title: "Unresolved Summation \\(\\sum_{j=i+1}^{n} a_{ij} x_j^{(k)}\\)",
            content: `Unresolved summation \\(\\sum_{j=i+1}^{n} a_{ij} x_j^{(k)}\\) un connected body elements ke drag ko represent karta hai jinka calculation current iteration me abhi tak nahi hua hai (jaise B1 ke niche latakne wale climbers). Par CPU abhi tak array me in tak nahi pahuncha hai. Inka math update nahi hua hai. To engine kya karta hai? Wo bas in niche wale climbers ki <code>linearVelocity</code> ko pichle sub-step (\\(k\\) state) se read kar leta hai.<br><br>Ye stale (purana) data hota hai, jo ek educated guess ki tarah kaam kaam karta hai. Kyunki agar engine har ek climber ko ek hi nanosecond me perfectly calculate karne rukega, to hardware thread lock ho jayega aur game crash ho jayega.`
        },
        a_ij: {
            title: "Coupling Coefficient \\(a_{ij}\\)",
            content: `Coupling coefficient \\(a_{ij}\\) connected bodies ke beech ki grip strength ya link interaction represent karta hai. Actual game development me insaani haath nahi hote, balki components hote hain. Jab aap Unity ya Unreal Engine me ragdoll banate hain, to arms aur legs ko connect karne ke liye <code>ArticulationBody</code> ya <code>HingeJoint</code> use karte hain. Ye \\(a_{ij}\\) coefficient seedhe un <code>Stiffness</code> aur <code>Damping</code> numbers se control hota hai jo aap manually inspector panel me type karte hain. High stiffness matlab engine forces ko 100% instantly transfer karne par force karega.`
        },
        temporal: {
            title: "Temporal Coherence (Samay Coherence)",
            content: `Temporal coherence ka matlab hai pichle frames ki physical state ko naye frames ke starting guess ki tarah reuse karna. Computer kaise guess karta hai ki objects ko kahan jana chahiye? Wo zero se start nahi karta kyuki usme bohot CPU power waste hogi. Dekho, 1/60th second bohot chota time hai jisme objects na ke barabar move karte hain. Isliye engine temporal coherence ka use karta hai aur pichle frame ki memory state ko recycle kar leta hai.<br><br>Wo 16 milliseconds pehle wale final impulses ko copy-paste karke naye frame ka starting point bana deta hai. Iska matlab climbers ko har frame me zero se calculate karne ke bajaye, unhe pichli position se hi aage process kiya jata hai aur bas chote adjustments kiye jate hain.`
        },
        mobility: {
            title: "Mobility (Inertia Inversion)",
            content: `Mobility physical mass ka mathematical inverse (\\(1/\\text{mass}\\)) hota hai. Adjustments karne ke liye math chahiye, aur computer processor division (bhaag) karne me bohot slow hote hain kyunki division hardware levels par bohot zyada clock cycles consume karta hai. Is computational delay se bachne ke liye engine mobility ka use karta hai.<br><br>Engine ise pehle hi calculate karke save kar leta hai taaki CPU ko divide na karna pade aur wo seedhe multiplication (guna) kar sake. High mobility matlab object bohot halka hai, aur low mobility matlab object heavy hai. Agar B1 ki mobility high hai, to CPU uske math coordinates ko easily shift karta hai.`
        },
        unbalanced: {
            title: "Unbalanced Force (Avashisht Bal)",
            content: `Unbalanced force tab paida hota hai jab kisi body par lagne wale saare opposing forces balance nahi hote. Maan lo B1 cliff par latka hai aur gravity use niche khinch rahi hai jabki upar wale climbers use upar pull kar rahe hain. CPU downward force me se upward force ko subtract karta hai. Agar answer zero hai to wo balanced hai.<br><br>Par agar gravity 100 units se niche pull kare aur upar se sirf 90 units ka pull mile? To 10 units ka force niche ki taraf bach jayega. Yahi leftover 10 units unbalanced force hai, jo ki equation me ek mathematical error hai jise solver ko theek karna hota hai.`
        },
        slip: {
            title: "Slip (Visthapan)",
            content: `Slip wo actual mathematical displacement ya velocity correction hai jise engine apply karta hai. Engine unbalanced force ke error ko fix karne ke liye slip ka use karta hai. Ye unbalanced force ko mobility se multiply karta hai jisse velocity displacement ka exact number milta hai. Simulation me ye B1 ke haath ka cliff edge par thoda niche slide hone jaisa dikhta hai, taaki wo aisi position par pahunch sake jahan forces balance hokar zero ho jayein.`
        },
        sub_steps: {
            title: "Sub-Steps (Temporal Divisions)",
            content: `Game loop 60 frames per second par chalta hai, yaani engine ke paas computation ke liye 0.016 seconds ka time delta (\\(\\Delta t\\)) hota hai. Standard physics equation hoti hai: <code>New Position = Old Position + (Velocity * \\Delta t)</code>.<br><br>Lekin agar velocity bohot high ho, to ek frame me object sidha wall ke paar teleport ho jayega aur collision detect hi nahi hoga. Ise rokne ke liye hum <code>sub_steps</code> ko 4 par set karte hain, jisse CPU us 16ms ke window ko 4 hisso me baat kar har 4ms me position aur collision checks chalata hai. Isse accuracy to badhti hai par CPU par mathematical load 4 guna badh jata hai.`
        },
        iterations: {
            title: "Iterations (Gauss-Seidel Loops)",
            content: `Gauss-Seidel solver me iterations tab zaroori hoti hain jab hume multiple connected physics constraints ko iterative sweep me process karna hota hai. Hume math ko loop karne ki zaroorat kyu padti hai? Kyunki game me saare physics constraints aapas me connected hote hain. Agar aap B1 ko upar pull karoge to uske niche connected B2 drag hoga, jisse ek constraint theek karne par dusra kharab ho jata hai.<br><br>Jab hum <code>iterations</code> ko 10 par set karte hain, to CPU constraints ko RAM se cache me load karke baar-baar solve karta hai. Har loop (Gauss-Seidel sweep) ke sath residual error kam hota jata hai aur numbers target state par converge hote hain. 10 iterations ke baad error itna kam ho jata hai ki joint bilkul rigid steel ki tarah behave karta hai.`
        },
        static: {
            title: "BodyType::Static",
            content: `Kabhi-kabhi hume terrain, floor ya cliff wall chahiye hoti hai jo apni jagah se hil na sake. Code me hum ise static body label karte hain. Isse physics engine in objects ko gravity aur collisions se completely ignore kar deta hai. Agar koi dynamic body isse collide karegi to bhi static body apni jagah se bilkul nahi hilegi aur infinite mass ki tarah behave regi.`
        },
        inv_mass: {
            title: "Inverse Mass (1/Mass)",
            content: `Inverse mass (\\(1/\\text{mass}\\)) compiler aur CPU optimizations ke liye use hota hai. Hum static bodies ko rokne ke liye code me 'if' statements kyu nahi likhte? Kyunki CPU 'if' statements ko predict karne me fail hone par performance slow kar deta hai (branch prediction failure). Isse bachne ke liye physics engines <code>inv_mass</code> (\\(1/\\text{mass}\\)) ka use karte hain.<br><br>Static bodies ke liye <code>inv_mass</code> ko hardcode karke <code>0.0</code> set kar diya jata hai. Jab bhi koi force multiply hoti hai, to multiplication zero se hone ke karan answer zero aata hai aur velocity output zero rehti hai. CPU bina kisi decision branch ke straight line me execution complete kar leta hai aur crash se bhi bacha rehta hai.`
        },
        dynamic: {
            title: "BodyType::Dynamic",
            content: `Dynamic body fully simulated physical object hota hai jiska ek real, non-zero mass hota hai. Gravity ispar kaam karti hai, collisions se ye bounce karta hai, aur joints se connect hone par ye unke sath move karta hai. Engine har single frame me in dynamic bodies ke liye saare forces aur friction rules calculate karta hai.`
        },
        update: {
            title: "World Update Cycle",
            content: `Jab game loop update call karta hai, to ye RAM me strict pipeline trigger karta hai:<br><br><b>Broadphase</b>: CPU bounding boxes check karke non-colliding objects ko fast discard karta hai.<br><br><b>Narrowphase</b>: Overlapping objects ke beech exact contact point nikalne ke liye complex algorithms (jaise GJK/EPA) run karta hai.<br><br><b>Solver</b>: Un contact points par constraints ke equations banakar iterative loop chalata hai.<br><br><b>Integration</b>: Solved velocities ke sath positions update karke RAM me coordinates ko write karta hai.`
        },
        constraints: {
            title: "Constraints Count",
            content: `Constraint bas ek mathematical rule hai jo engine ko solve karna hota hai. Agar do boxes touch ho rahe hain, to wo contact point ek constraint hai (ki wo aapas me penetate nahi ho sakte). Agar unhe rope se connect kiya hai, to wo joint constraint hai. Engine active constraints ka count telemetry me monitor karta hai taaki pata chale CPU par kitna load hai.`
        },
        batches: {
            title: "Execution Batches",
            content: `Execution batches ka matlab hai physics constraints ko independent groups (islands) me divide karna. Multi-core processors me multiple cores hote hain. Lekin agar core 1 aur core 2 dono ek hi memory address par data write karne ki koshish karein to race condition se crash ho sakta hai. Isliye engine independent groups (islands) banata hai.<br><br>Agar map ke left side ke boxes aapas me touch ho rahe hain aur right side ke cars aapas me collide ho rahe hain, to engine inko separate batches me baantkar core 1 aur core 2 ko parallel execution ke liye de deta hai taaki memory corruption na ho.`
        },
        simd: {
            title: "SIMD Vectorization",
            content: `Normal scale calculation me CPU ek waqt me ek hi math equation process karta hai. Lekin modern CPUs me SIMD (Single Instruction Multiple Data) registers hote hain, jo 256-bit wide hardware slots (YMM) use karte hain.<br><br>Isse engine 8 alag floating-point calculations ko pack karke ek single clock cycle me solve kar leta hai, jisse vector math aur dot products hardware level par accelerate ho jate hain aur CPU bottleneck dur hota hai.`
        }
    },
    english: {
        collision: {
            title: "Collision (Interaction)",
            content: `What is a collision really? In the real world, you drop a cup, it hits the floor, and physical matter physically stops it. But inside a computer? There is no physical matter. It's just empty digital space. So, how does a game engine know two things touched? Every object has an invisible 3D math boundary around it. We call this a collider. Every single frame, the engine looks at the X, Y, and Z coordinates of every collider.<br><br>When the coordinates of Climber B1's boundary overlap with the cliff wall's boundary, the engine throws a red flag. That overlap is the intersection. But it doesn't just stop there. The engine immediately finds the exact mathematical center of that overlap, called a contact point. Then, it fires a normal bounce impulse. And what is that? It is just an instant spike of digital force pushing straight back out at a 90-degree angle to separate the two objects so they don't phase through each other.`
        },
        penetration: {
            title: "Collision Penetration (Clipping)",
            content: `Collision penetration occurs when two physical colliders overlap or sink into each other during a frame. In real life, physics prevents atoms from occupying the exact same space. Computers don't have that rule naturally built-in. A game just updates a character's position every 1/60th of a second. If B1 is falling toward the wall really fast, in frame one, he is a foot away from the cliff. In frame two, he is already three inches inside the solid rock. That is penetration.<br><br>The engine missed the exact moment they touched. So, how do we fix a guy stuck inside a wall? We use Baumgarte positional corrections. That sounds complicated, but it's just a digital measuring tape. The engine calculates exactly how far B1 sank into the cliff face. If he is three inches inside, the engine just rewrites his position coordinates to push him three inches backwards. It forcefully resets his math to the surface of the rock.`
        },
        friction: {
            title: "Friction (Lateral Resistance)",
            content: `Friction is a lateral resistive force that acts tangentially along contact surfaces to oppose relative sliding. When a climber is pressed flat against the wall, friction prevents them from instantly sliding down into the abyss. Friction isn't a force that pushes you away from the wall. It is a resistive force that pushes perfectly sideways along the surface. It fights sliding. We call this a tangential constraint impulse.<br><br>But B1's grip isn't infinite, right? If you put too much weight on him, he falls. The engine controls this breaking point using Coulomb's Law, which is just the formula \\(f_t \\le \\mu f_n\\). Let's translate that. It means the sideways holding force (\\(f_t\\)) cannot be mathematically larger than the wall's grip multiplier (\\(\\mu\\)) multiplied by how hard B1 is being smashed into the rock (\\(f_n\\)). If gravity pulls down harder than that final math limit, the engine lets him slip.`
        },
        joints: {
            title: "Articulated Joints (Linkages)",
            content: `Articulated joints connect multiple physical bodies together in a parent-child chain, restricting their relative translation or rotation. When climbers hold onto each other to form a chain, the engine uses articulated joints to lock their connections. Normally, a 3D object has complete freedom. It can move left, right, up, down, and spin any way it wants. An articulated joint is basically the engine revoking those freedoms. It is a hardcoded rule that locks two bodies together.<br><br>When B1 holds B2's hand, the engine creates a strict distance constraint. It tells the computer, "These two math coordinates can never be more than zero inches apart." If B1's coordinate moves up, the engine forcefully drags B2's coordinate up with it. It restricts their translation and rotation so they stop acting like independent floating boxes and start acting like a single, physically connected hanging chain.`
        },
        x_i: {
            title: "Target State \\(x_i^{(k+1)}\\)",
            content: `The target state variable \\(x_i^{(k+1)}\\) represents the final converged position or velocity of a dynamic body at the end of a solver step. Inside a game engine like Box2D or Nvidia PhysX, this isn't just one magic number. The engine stores this as a variable called <code>accumulatedImpulse</code>.<br><br>Instead of applying one massive, explosive jolt to B1 in a single frame, the engine adds up tiny micro-pushes over several loops. The engine physically clamps this <code>accumulatedImpulse</code> limit in the RAM. So, if the force gets too high, it caps it, preventing B1's digital body from violently jittering or exploding across the map. The \\(k+1\\) just means the engine is writing this updated impulse to the current, active memory address.`
        },
        a_ii: {
            title: "Diagonal Matrix Element \\(a_{ii}\\)",
            content: `The diagonal matrix element \\(a_{ii}\\) represents the effective mass and rotational inertia of the physical body, indicating how much it resists acceleration. Game engines don't just use pure mass. In C++ physics code, this is calculated as <code>effectiveMass</code>.<br><br>Why? Because it matters exactly <i>where</i> the forces are pulling. If the climber above grabs B1 by the wrist, the <code>effectiveMass</code> calculation is entirely different than if he grabs B1 by the center of his chest. The engine takes B1's raw weight, runs a cross-product matrix against the exact pixel location of the joint contact point, and generates the <code>effectiveMass</code>. And to avoid the CPU choking on slow division math, the engine calculates the inverse (\\(1 / a_{ii}\\)) ahead of time.`
        },
        b_i: {
            title: "Bias Vector Element \\(b_i\\)",
            content: `The bias vector element \\(b_i\\) represents raw, uncorrected external forces (such as gravity) or positional penetration errors that the solver must resolve. Gravity dragging B1 down is a classic example. In an engine, this is handled by a variable usually called <code>biasRate</code> or a <code>positionImpulse</code>.<br><br>The engine literally measures the visual error on the screen. Did B1's arm joint visually stretch two inches away from the guy holding him? The engine takes that two-inch error, multiplies it by a stiffness factor, and turns it into a mathematical force. It forces the solver to yank B1 back into place.`
        },
        sum_t: {
            title: "Resolved Summation \\(\\sum_{j=1}^{i-1} a_{ij} x_j^{(k+1)}\\)",
            content: `The resolved summation \\(\\sum_{j=1}^{i-1} a_{ij} x_j^{(k+1)}\\) represents the cumulative forces or impulses from all connected constraints that have already been updated in the current solver sweep. For example, this is the feedback from the climbers above B1 pulling him up. In a CPU, code executes in a strict, top-to-bottom <code>for</code> loop. The climbers above B1 (T1, T2, T3) sit earlier in the memory array. The CPU has already crunched their math for this frame. So, when calculating B1, the engine just reads their updated <code>linearVelocity</code> directly out of the L1 Cache.<br><br>Game engines heavily rely on a trick called <code>warm starting</code> here. They feed the exact tension forces from the previous frame directly into the current one, giving the CPU a massive head start on solving the joint chain.`
        },
        sum_b: {
            title: "Unresolved Summation \\(\\sum_{j=i+1}^{n} a_{ij} x_j^{(k)}\\)",
            content: `The unresolved summation \\(\\sum_{j=i+1}^{n} a_{ij} x_j^{(k)}\\) represents the forces from connected constraints that have not yet been updated in the current solver iteration, forcing the engine to use values from the previous step (\\(k\\)). This matches the drag from the climbers hanging below B1. The CPU hasn't reached them in the array yet. Their math hasn't been updated. So, what does the engine do? It simply reads the <code>linearVelocity</code> of those lower climbers from the previous physics sub-step (the \\(k\\) state).<br><br>It uses stale data. It is a highly educated guess. Because if the engine stopped to calculate them perfectly at the exact same nanosecond, the hardware thread would lock up and crash the game.`
        },
        a_ij: {
            title: "Coupling Coefficient \\(a_{ij}\\)",
            content: `The coupling coefficient \\(a_{ij}\\) represents the physical interaction strength or constraint connection between two bodies, such as the stiffness of a connecting joint. In actual game development, you don't have human hands. You have components. When you build a ragdoll in Unity or Unreal Engine, you connect the arms and legs using an <code>ArticulationBody</code> or a <code>HingeJoint</code>. This \\(a_{ij}\\) coefficient is directly controlled by the <code>Stiffness</code> and <code>Damping</code> numbers you manually type into the engine's Inspector panel. High stiffness means the engine forces the math to transfer 100% of the pulling force instantly.`
        },
        temporal: {
            title: "Temporal Coherence (Time History)",
            content: `Temporal coherence is the principle of recycling velocity and position states from the previous frame to initialize calculations for the current frame, saving valuable CPU cycles. Computer doesn't start from scratch. That would waste too much processing power. Think about it. 1/60th of a second is practically nothing. Objects barely move in that time. So, the engine uses temporal coherence. It looks at the exact memory state of the last frame and recycles it.<br><br>It takes the final mathematical impulses from 16 milliseconds ago and literally copy-pastes them as the starting point for the new frame. For our climbers, this means instead of recalculating their entire body weight and position from zero, the engine just starts them exactly where they ended a millisecond ago. And then it just makes tiny adjustments.`
        },
        mobility: {
            title: "Mobility (Inverse Inertia)",
            content: `Mobility is the mathematical inverse of mass (\\(1/\\text{mass}\\)). Precalculating mobility allows the CPU to replace slow division operations with fast multiplication to compute adjustments quickly. Heavy things are hard to move. Light things are easy to move. In a normal physics equation, you divide by mass to figure out movement. But here is the problem with computers. CPUs hate division. Division takes up way too many electrical clock cycles. So, the engine uses mobility instead.<br><br>Mobility is just the mathematical opposite of mass. It is one divided by mass. The engine calculates this once and saves it. Now, instead of division, the CPU just uses multiplication. High mobility means an object is incredibly light. Low mobility means it is heavy. If B1 has high mobility, his math coordinates are physically easier for the processor to shift.`
        },
        unbalanced: {
            title: "Unbalanced Force (Residual)",
            content: `An unbalanced force (residual error) occurs when the sum of opposing forces acting on a body does not equal zero. For example, if gravity pulls B1 down with 100 units of force, but the climbers above pull up with only 90, you have 10 units of force left over pulling down. That leftover 10 is the unbalanced force. It is literally a mathematical error in the equation. And the engine cannot leave an error just sitting there.`
        },
        slip: {
            title: "Slip (Correction Displacement)",
            content: `Slip represents the physical correction displacement or velocity adjustment applied to a body to resolve an unbalanced force. It is calculated by multiplying the unbalanced force by the body's mobility. It takes that unbalanced force of 10 we just talked about, and multiplies it by B1's mobility. The result is a highly specific velocity displacement. It is an exact number of pixels or coordinate units the object needs to move to cancel out the error. In the simulation, this looks like B1 sliding his hands down the cliff edge. His math coordinates shift. He moves to a new, stable position where the forces finally balance out to zero.`
        },
        sub_steps: {
            title: "Sub-Steps (Time Division)",
            content: `A game loop usually runs at 60 frames per second. That means the engine has a time delta (\\(\\Delta t\\)) of 0.016 seconds to calculate everything. The standard physics equation is: <code>New Position = Old Position + (Velocity * \\Delta t)</code>.<br><br>But if an object's velocity is incredibly high, multiplying it by 0.016 results in a massive jump in position. The object literally teleports from point A to point B in memory. If a cliff wall exists between point A and point B, the engine never registers a collision.<br><br>When you increase <code>sub_steps</code> to 4, you are forcing the CPU to divide that 0.016s delta by 4. The CPU now physically executes the entire physics pipeline four separate times per frame, using a \\(\\Delta t\\) of 0.004s. The object moves in tiny, safe increments. The tradeoff? You are demanding exactly 4x the computational clock cycles from the processor.`
        },
        iterations: {
            title: "Iterations (Relaxation Passes)",
            content: `Iterations in a physics solver are sequential passes used to resolve interconnected constraints, where adjusting one constraint might temporarily throw another out of balance. Why do we need to loop the math? Because physics constraints are connected. If you push B1 up to satisfy a joint, you accidentally stretch the joint connecting B1 to B2. Fixing constraint A breaks constraint B.<br><br>When you set <code>iterations</code> to 10, the CPU fetches the array of constraints from the RAM into its L1 cache. It solves A, then B, then C. By the time it finishes C, A is slightly wrong again. So, the CPU loops back and runs the math a second time. Every time the CPU runs a Gauss-Seidel sweep over the memory array, the residual error gets smaller and smaller. The variables physically converge toward the correct numbers. At iteration 10, the error is so small that the human eye perceives the joint as completely rigid steel.`
        },
        static: {
            title: "BodyType::Static",
            content: `Sometimes you need a floor or a cliff wall that never moves. Ever. In the code, you label it as a static body. This tells the physics engine to completely ignore this object when calculating things like gravity or momentum. If a massive dynamic object crashes into it at a million miles an hour, the static body does not flinch. It is an immovable anchor representing infinite mass.`
        },
        inv_mass: {
            title: "Inverse Mass (1/M)",
            content: `Inverse mass (\\(1/\\text{mass}\\)) is set to exactly 0.0 for static bodies to prevent them from moving. This mathematical trick avoids CPU branch prediction stalls caused by conditional 'if' checks. Why not just write an 'if' statement in the code to stop that static wall from moving? Because computer processors hate 'if' statements. Asking a question forces the physical hardware to guess the answer, and if it guesses wrong, it has to dump all its calculations and start over. That ruins performance. So, instead of using 'if', the engine uses <code>inv_mass</code>. For a static wall, the engine deliberately hardcodes that <code>inv_mass</code> number to exactly 0.0. So, when another object hits the wall, the engine just multiplies the incoming crash force by zero. The resulting movement is zero. The CPU crunches the math straight down the wire without ever having to stop, guess, or ask a question.<br><br>At the silicon level, multiplying the voltage of the force by zero outputs zero voltage to the velocity register. The wall's velocity remains exactly zero. The CPU executes the math without ever needing to pause and ask "is this a wall?", completely eliminating branch prediction stalls.`
        },
        dynamic: {
            title: "BodyType::Dynamic",
            content: `A dynamic body is a fully simulated physical object with real, non-zero mass that responds to gravity, collisions, and joint constraints. Gravity grabs it and pulls it down. When things hit it, it bounces away. When a joint pulls it, it moves. The engine has to calculate every single physical force and friction rule for these dynamic bodies every single time the screen draws a frame.`
        },
        update: {
            title: "World Update Cycle",
            content: `When the main game loop calls update, it triggers a highly strict sequence of hardware instructions.<br><br><b>Broadphase</b>: The CPU checks simple, invisible bounding boxes around every object. If the boxes don't overlap, the CPU discards them immediately to save processing power.<br><br><b>Narrowphase</b>: For the boxes that do overlap, the CPU runs intense geometric algorithms (like GJK or EPA) to find the exact pixel-perfect coordinate of the contact point.<br><br><b>Solver</b>: It takes those contact points, builds the math equations, and runs the iterations loop we discussed above.<br><br><b>Integration</b>: Finally, the CPU takes the solved velocities and overwrites the X, Y, and Z position coordinates in the computer's RAM.`
        },
        constraints: {
            title: "Constraints Count",
            content: `A constraint is just a strict mathematical rule the engine has to solve. If two boxes touch each other, that contact point is a constraint. It is a rule saying 'these two things cannot occupy the same space'. If you link two boxes with a rope, that is a joint constraint. It says 'these two things cannot be more than five feet apart'. The engine keeps a running count of every single rule. It acts as a telemetry number to show you exactly how much pressure your physics system is putting on the processor right now.`
        },
        batches: {
            title: "Execution Batches",
            content: `Execution batches partition independent groups of colliding objects (islands) to run concurrently. Modern CPUs have multiple cores (Core 1, Core 2, Core 3). You want them all working at once. But there is a hazard called a data race. If Core 1 is calculating Climber B1's left arm, and Core 2 is calculating B1's right arm, they might both try to write a new position to B1's exact same memory address in RAM at the exact same nanosecond. The hardware panics, and the data corrupts.<br><br>To stop this, the engine analyzes the map before solving. It looks for physical islands—groups of objects touching each other, but entirely separated from other groups. This is batches. The engine sends the Climber Island to Core 1, and an entirely separate Car Crash Island to Core 2. Because the memory addresses of the climbers and the cars are physically separated in RAM, the cores can run at 100% speed without ever accidentally overwriting each other's data.`
        },
        simd: {
            title: "SIMD Vectorization",
            content: `Normally, a CPU processes one instruction at a time. It loads one 32-bit number into a register, loads a second 32-bit number, adds them, and outputs the result. This is called scalar math.<br><br>SIMD (Single Instruction, Multiple Data) fundamentally changes the hardware utilization. Modern silicon has massive, 256-bit wide hardware slots called YMM registers. Instead of loading one number, the engine packs eight different 32-bit constraint numbers into a single YMM register.<br><br>When the CPU fires the VADDPS (Vector Add Packed Single-Precision) electrical instruction, the silicon physically processes all eight calculations in a single clock cycle. It is the exact same electrical cost as calculating one number, but you get eight answers. Tracking total_simd_constraints tells the engine how successfully it is packing these hardware registers to bypass the standard math bottlenecks.`
        }
    },
    spanish: {
        collision: {
            title: "Colisión (Interacción)",
            content: `¿Qué es una colisión realmente? En el mundo real, si se te cae una taza, golpea el suelo y la materia física la detiene. ¿Pero dentro de una computadora? No hay materia física. Es solo espacio digital vacío. Entonces, ¿cómo sabe un motor de juego que dos cosas se tocaron? Cada objeto tiene un límite matemático 3D invisible a su alrededor. A esto lo llamamos colisionador. En cada fotograma, el motor analiza las coordenadas X, Y, Z de cada colisionador.<br><br>Cuando las coordenadas del colisionador del escalador B1 se superponen con las de la pared del acantilado, el motor genera una alerta. Esa superposición es la intersección. Pero no se detiene ahí. El motor encuentra de inmediato el centro matemático exacto de esa superposición, llamado punto de contacto. Luego, aplica un impulso de rebote normal, que es simplemente un pico instantáneo de fuerza digital que empuja hacia afuera en un ángulo de 90 grados para separar ambos objetos y evitar que se atraviesen entre sí.`
        },
        penetration: {
            title: "Penetración de Colisiones (Solapamiento)",
            content: `La penetración de colisiones ocurre cuando dos colisionadores se superponen o se hunden el uno en el otro durante un fotograma. En la vida real, la física evita que los átomos ocupen el mismo espacio. Las computadoras no tienen esa regla incorporada por defecto. Un juego simplemente actualiza la posición del personaje cada 1/60 de segundo. Si B1 está cayendo rápido hacia la pared, en el fotograma uno está a un metro del acantilado, y en el fotograma dos ya está diez centímetros dentro de la roca sólida. Eso es penetración.<br><br>El motor se perdió el momento exacto en que se tocaron. Entonces, ¿cómo arreglamos a un personaje atrapado dentro de una pared? Usamos las correcciones posicionales de Baumgarte. Suena complicado, pero es solo una cinta métrica digital. El motor calcula exactamente cuánto se hundió B1 en la pared. Si está a diez centímetros dentro, simplemente reescribe sus coordenadas de posición para empujarlo diez centímetros hacia atrás. Restablece a la fuerza su matemática a la superficie de la roca.`
        },
        friction: {
            title: "Fricción (Resistencia Lateral)",
            content: `La fricción es una fuerza resistiva que actúa tangencialmente a lo largo de las superficies de contacto para oponerse al deslizamiento. Cuando un escalador está presionado contra la pared, la fricción evita que se deslice instantáneamente hacia el abismo. La fricción no es una fuerza que te empuja lejos de la pared. Es una fuerza resistiva que empuja perfectamente de lado a lo largo de la superficie, oponiéndose al deslizamiento. Llamamos a esto un impulso de restricción tangencial.<br><br>Pero el agarre de B1 no es infinito, ¿verdad? Si le pones demasiado peso, se caerá. El motor controla este punto de ruptura mediante la Ley de Coulomb, que es la fórmula \\(f_t \\le \\mu f_n\\). Traduzcamos eso: significa que la fuerza de retención lateral (\\(f_t\\)) no puede ser matemáticamente mayor que el multiplicador de agarre de la pared (\\(\\mu\\)) multiplicado por la fuerza con la que B1 está siendo aplastado contra la roca (\\(f_n\\)). Si la gravedad tira hacia abajo con más fuerza que ese límite matemático final, el motor deja que se deslice.`
        },
        joints: {
            title: "Articulaciones Articuladas (Enlaces)",
            content: `Las articulaciones articuladas son restricciones cinemáticas que conectan múltiples cuerpos físicos en una cadena, limitando su traslación o rotación relativa. Cuando los escaladores forman una cadena, el motor utiliza estas articulaciones para bloquear sus conexiones. Normalmente, un objeto 3D tiene total libertad para moverse en cualquier dirección y rotar como quiera. Una articulación articulada es básicamente el motor revocando esas libertades. Es una regla estricta en el código que une dos cuerpos rígidos.<br><br>Cuando B1 sostiene la mano de B2, el motor crea una restricción de distancia estricta. Le dice a la computadora: "Estas dos coordenadas matemáticas nunca pueden estar a más de cero centímetros de distancia". Si la coordenada de B1 sube, el motor arrastra a la fuerza la coordenada de B2 con ella, evitando que actúen como cajas flotantes independientes y haciendo que se comporten como una cadena humana conectada.`
        },
        x_i: {
            title: "Estado Objetivo \\(x_i^{(k+1)}\\)",
            content: `La variable de estado objetivo \\(x_i^{(k+1)}\\) representa la posición o velocidad final convergente de un cuerpo dinámico al final del paso de física. En la matemática pura, esta es la respuesta final. Es la posición o velocidad exacta a la que debe moverse nuestro escalador, B1. Pero dentro de un motor de física como Box2D o Nvidia PhysX, esto no es solo un número mágico. El motor lo almacena en una variable llamada <code>accumulatedImpulse</code>.<br><br>En lugar de aplicar un impulso masivo y explosivo a B1 en un solo fotograma, el motor acumula pequeños micro-empujes a lo largo de varios bucles. El motor limita físicamente este <code>accumulatedImpulse</code> en la RAM. Si la fuerza es demasiado alta, la limita para evitar que el cuerpo digital de B1 vibre violentamente o explote por el mapa. El término \\(k+1\\) significa que el motor está escribiendo este impulso actualizado en la dirección de memoria activa actual.`
        },
        a_ii: {
            title: "Elemento de Matriz Diagonal \\(a_{ii}\\)",
            content: `El elemento de la diagonal de la matriz \\(a_{ii}\\) representa la masa efectiva y la inercia rotacional del cuerpo físico, indicando cuánto se resiste a ser acelerado. Los motores de juego no usan masa pura. En el código de física de C++, esto se calcula como <code>effectiveMass</code>.<br><br>¿Por qué? Porque importa exactamente <i>dónde</i> se aplican las fuerzas. Si el escalador de arriba agarra a B1 por la muñeca, el cálculo de <code>effectiveMass</code> es completamente diferente a si lo agarra por el centro del pecho. El motor toma el peso bruto de B1, realiza un producto cruzado matricial contra la posición exacta en píxeles del punto de contacto y genera la <code>effectiveMass</code>. Para evitar que la CPU se ralentice con divisiones matemáticas, calcula la inversa (\\(1 / a_{ii}\\)) por adelantado.`
        },
        b_i: {
            title: "Elemento Vectorial Sesgo \\(b_i\\)",
            content: `El elemento vectorial de sesgo \\(b_i\\) representa las fuerzas externas no corregidas (como la gravedad) o los errores de penetración posicional que el resolvedor debe corregir. Esta es la fuerza externa pura y sin corregir. La gravedad arrastrando a B1 hacia abajo es un ejemplo clásico. En un motor, esto se maneja con una variable llamada <code>biasRate</code> o <code>positionImpulse</code>.<br><br>El motor mide literalmente el error visual en la pantalla. ¿La articulación del brazo de B1 se estiró visualmente cinco centímetros lejos de quien lo sostiene? El motor toma ese error, lo multiplica por un factor de rigidez y lo convierte en una fuerza matemática que obliga al resolvedor a colocar a B1 de nuevo en su lugar.`
        },
        sum_t: {
            title: "Suma Resuelta \\(\\sum_{j=1}^{i-1} a_{ij} x_j^{(k+1)}\\)",
            content: `La suma resuelta \\(\\sum_{j=1}^{i-1} a_{ij} x_j^{(k+1)}\\) representa las fuerzas o impulsos acumulados de todas las restricciones conectadas que ya han sido actualizadas en el barrido actual del resolvedor. Esta es la retroalimentación de las personas por encima de B1 que tiran de él hacia arriba. En una CPU, el código se ejecuta en un bucle <code>for</code> estricto de arriba a abajo. Los escaladores por encima de B1 (T1, T2, T3) están antes en el arreglo de memoria. La CPU ya resolvió su matemática para este fotograma. Por lo tanto, al calcular B1, el motor lee su <code>linearVelocity</code> actualizada directamente de la caché L1.<br><br>Los motores de juego dependen de un truco llamado <code>warm starting</code> (inicio en caliente). Alimentan las fuerzas de tensión exactas del fotograma anterior directamente en el actual, dándole a la CPU una gran ventaja para resolver la cadena de articulaciones.`
        },
        sum_b: {
            title: "Suma No Resuelta \\(\\sum_{j=i+1}^{n} a_{ij} x_j^{(k)}\\)",
            content: `La suma no resuelta \\(\\sum_{j=i+1}^{n} a_{ij} x_j^{(k)}\\) representa las fuerzas de restricciones conectadas que aún no han sido actualizadas en la iteración actual del resolvedor, obligando al motor a usar los valores del subpaso anterior (\\(k\\)). Este es el arrastre de los escaladores que cuelgan debajo de B1. Pero la CPU aún no los ha alcanzado en el arreglo. Su matemática no se ha actualizado. Entonces, ¿qué hace el motor? Simplemente lee la <code>linearVelocity</code> de esos escaladores inferiores del subpaso de física anterior (el estado \\(k\\)).<br><br>Usa datos antiguos. Es una suposición educada. Si el motor se detuviera a calcularlos perfectamente al mismo nanosegundo, el hilo del hardware se bloquearía y el juego se colgaría.`
        },
        a_ij: {
            title: "Coeficiente de Acoplamiento \\(a_{ij}\\)",
            content: `El coeficiente de acoplamiento \\(a_{ij}\\) representa la fuerza de interacción física o conexión de restricción entre dos cuerpos, como la rigidez de una articulación de acoplamiento. En el desarrollo de juegos real, no tienes manos humanas. Tienes componentes. Cuando construyes un ragdoll en Unity o Unreal Engine, conectas los brazos y las piernas usando un <code>ArticulationBody</code> o un <code>HingeJoint</code>. Este coeficiente \\(a_{ij}\\) se controla directamente con los valores de <code>Stiffness</code> (rigidez) y <code>Damping</code> (amortiguación) que escribes en el panel del Inspector. Una rigidez alta obliga a transferir el 100% de la fuerza al instante.`
        },
        temporal: {
            title: "Coherencia Temporal (Historial)",
            content: `La coherencia temporal es el principio de reciclar los estados de velocidad y posición del fotograma anterior para iniciar los cálculos del fotograma actual, ahorrando valiosos ciclos de CPU. ¿Cómo adivina una computadora hacia dónde deben ir las cosas? No empieza desde cero cada vez, eso consumiría demasiada potencia de procesamiento. Piensa en esto: 1/60 de segundo no es casi nada, los objetos apenas se mueven en ese tiempo. Por eso, el motor utiliza la coherencia temporal. Analiza el estado exacto de la memoria del fotograma anterior y lo recicla.<br><br>Toma los impulsos matemáticos finales de hace 16 milisegundos y los copia y pega como punto de partida para el nuevo fotograma. Para nuestros escaladores, esto significa que en lugar de recalcular todo su peso y posición desde cero, el motor los coloca exactamente donde terminaron hace un milisegundo y luego hace pequeños ajustes.`
        },
        mobility: {
            title: "Movilidad (Inversión de Inercia)",
            content: `La movilidad es la inversa matemática de la masa (\\(1/\\text{mass}\\)). Dado que los procesadores realizan la división de forma lenta, usar la movilidad precalculada permite a la CPU reemplazar la división lenta por una multiplicación rápida para calcular ajustes rápidamente. Pero hacer esos ajustes requiere matemáticas. Específicamente, calcular la masa. Las cosas pesadas son difíciles de mover, las ligeras son fáciles. En una ecuación física normal, divides por la masa para calcular el movimiento. Pero aquí está el problema: a los procesadores les cuesta mucho dividir, ya que la división consume demasiados ciclos de reloj de la CPU. Por eso, el motor utiliza la movilidad en su lugar.<br><br>La movilidad es simplemente el inverso matemático de la masa (\\(1/\\text{mass}\\)). El motor la calcula una vez y la guarda. Ahora, en lugar de dividir, la CPU simplemente multiplica. Una movilidad alta significa que el objeto es increíblemente ligero, mientras que una movilidad baja significa que es pesado. Si B1 tiene alta movilidad, sus coordenadas matemáticas son físicamente más fáciles de mover para el procesador.`
        },
        unbalanced: {
            title: "Fuerza Desequilibrada (Residuo)",
            content: `Una fuerza desequilibrada (error residual) ocurre cuando la suma de las fuerzas opuestas que actúan sobre un cuerpo no es igual a cero. Por ejemplo, si la gravedad tira de un escalador hacia abajo con una fuerza de 100 unidades y los de arriba solo tiran con 90, te quedan 10 unidades de fuerza tirando hacia abajo. Esas 10 unidades restantes son la fuerza desequilibrada. Es literalmente un error matemático en la ecuación, y el motor no puede dejar un error sin resolver.`
        },
        slip: {
            title: "Deslizamiento (Desplazamiento)",
            content: `El deslizamiento representa la la corrección física de desplazamiento o ajuste de velocidad aplicado a un cuerpo para resolver una fuerza desequilibrada. Se calcula multiplicando la fuerza desequilibrada por la movilidad del cuerpo. Toma esa fuerza desequilibrada de 10 unidades y la multiplica por la movilidad de B1. El resultado es un desplazamiento de velocidad muy específico. Es la cantidad exacta de píxeles o unidades que el objeto necesita moverse para cancelar el error. En la simulación, esto se ve como B1 deslizando sus manos por el borde del acantilado hasta una nueva posición estable donde las fuerzas vuelven a sumar cero.`
        },
        sub_steps: {
            title: "Subpasos (División del Tiempo)",
            content: `Un bucle de juego funciona a 60 fotogramas por segundo, lo que significa que el motor tiene un delta de tiempo (\\(\\Delta t\\)) de 0.016 segundos para calcular todo. La ecuación física estándar es: <code>Nueva Posición = Posición Anterior + (Velocidad * \\Delta t)</code>.<br><br>Pero si la velocidad de un objeto es increíblemente alta, multiplicarla por 0.016 resulta en un salto enorme. El objeto literalmente se teletransporta de un punto a otro en la memoria. Si hay una pared en medio, el motor nunca detectará la colisión. Al aumentar los subpasos a 4, obligas a la CPU a dividir ese delta de 0.016s por 4, ejecutando todo el proceso físico cuatro veces por fotograma con un delta de 0.004s. El objeto se mueve en incrementos pequeños y seguros, aunque esto exige exactamente 4 veces más ciclos de cálculo a la CPU.`
        },
        iterations: {
            title: "Iteraciones (Pasadas de Relajación)",
            content: `Las iteraciones en un resolvedor de física son pasadas secuenciales utilizadas para resolver restricciones interconectadas, donde ajustar una restricción puede desequilibrar temporalmente otra. ¿Por qué necesitamos hacer bucles en los cálculos? Porque las restricciones físicas están interconectadas. Si tiras de B1 hacia arriba para cumplir con una articulación, accidentalmente estiras la que conecta a B1 con B2. Resolver la restricción A rompe la restricción B.<br><br>Cuando configuras las <code>iterations</code> en 10, la CPU carga el arreglo de restricciones de la RAM a su caché L1. Resuelve A, luego B, luego C. Para cuando termina con C, A vuelve a estar ligeramente mal. Así que la CPU vuelve a empezar una segunda vez. Con cada barrido de Gauss-Seidel sobre el arreglo de memoria, el error residual disminuye y las variables convergen hacia los números correctos. Tras 10 iteraciones, el error es tan pequeño que la articulación parece de acero rígido.`
        },
        static: {
            title: "BodyType::Static",
            content: `A veces necesitas un suelo o una pared de acantilado que no se mueva nunca. En el código, lo etiquetas como un cuerpo estático. Esto le dice al motor de física que ignore por completo este objeto al calcular la gravedad o el momento. Si un objeto dinámico choca contra él a gran velocidad, el cuerpo estático ni se inmuta. Es un anclaje inamovible que representa una masa infinita.`
        },
        inv_mass: {
            title: "Masa Inversa (1/M)",
            content: `La masa inversa (\\(1/\\text{mass}\\)) se establece exactamente en 0.0 para cuerpos estáticos para evitar que se muevan. Este truco matemático evita fallos en la predicción de ramificaciones del procesador al eliminar la necesidad de comprobaciones condicionales 'if'. ¿Por qué no escribir un condicional 'if' en el código para evitar que la pared estática se mueva? Porque a los procesadores no les gustan los condicionales. Obligan al hardware a adivinar el resultado de la decisión y, si falla, tiene que desechar sus cálculos y empezar de nuevo, arruinando el rendimiento. En su lugar, el motor utiliza <code>inv_mass</code> (masa inversa: \\(1 / \\text{mass}\\)).<br><br>Para una pared estática, el motor codifica su <code>inv_mass</code> exactamente como <code>0.0</code>. Así, cuando otro objeto choca contra ella, el motor multiplica la fuerza del impacto por cero, dando como resultado cero movimiento. La CPU procesa los cálculos de forma lineal sin detenerse a decidir nada, eliminando los fallos de predicción de la CPU.`
        },
        dynamic: {
            title: "BodyType::Dynamic",
            content: `Un cuerpo dinámico es un objeto físico completamente simulado con masa real no nula que responde a la gravedad, colisiones y restricciones de articulaciones. Tiene una masa real y medible, la gravedad lo tira hacia abajo, rebota al chocar y se mueve si una articulación tira de él. El motor tiene que calcular todas las fuerzas físicas y reglas de fricción para estos cuerpos dinámicos cada vez que se dibuja un fotograma en la pantalla.`
        },
        update: {
            title: "Ciclo de Actualización",
            content: `Cuando el bucle principal del juego llama a update, activa una secuencia estricta de instrucciones en el hardware:<br><br><b>Broadphase</b>: La CPU comprueba cajas de colisión simples a grandes rasgos. Si no se superponen, descarta los objetos de inmediato para ahorrar procesamiento.<br><br><b>Narrowphase</b>: Para las cajas que sí se superponen, ejecuta algoritmos geométricos complejos (como GJK o EPA) para encontrar la coordenada exacta del punto de contacto.<br><br><b>Solver</b>: Toma esos puntos de contacto, genera las ecuaciones matemáticas y ejecuta el bucle de iteraciones.<br><br><b>Integración</b>: Toma las velocidades resueltas y reescribe las nuevas coordenadas de posición X, Y, Z en la memoria RAM.`
        },
        constraints: {
            title: "Recuento de Restricciones",
            content: `Una restricción es simplemente una regla matemática estricta que el motor debe cumplir. Si dos cajas se tocan, ese punto de contacto es una restricción que dice: "estos dos objetos no pueden ocupar el mismo espacio". Si los unes con una cuerda, es una restricción de articulación que dice: "no pueden estar a más de dos metros". El motor lleva la cuenta de estas reglas como un indicador de telemetría para saber cuánta carga de trabajo está soportando la CPU.`
        },
        batches: {
            title: "Lotes de Ejecución",
            content: `Los lotes de ejecución dividen los grupos de restricciones u objetos que colisionan (islas) en lotes independientes. Los procesadores modernos tienen múltiples núcleos (Núcleo 1, Núcleo 2, etc.). Quieres que todos trabajen a la vez, pero existe el riesgo de una condición de carrera si el Núcleo 1 y el Núcleo 2 intentan escribir en la misma dirección de memoria al mismo nanosegundo, corrompiendo los datos. Para evitarlo, el motor agrupa las restricciones en lotes independientes.<br><br>Si tienes cajas chocando a la izquierda y coches chocando a la derecha, el motor los separa en lotes independientes y los envía a núcleos distintos para que resuelvan la física en paralelo y a máxima velocidad sin interferir en la memoria del otro.`
        },
        simd: {
            title: "Vectorización SIMD",
            content: `Normally, a CPU processes a math instruction one at a time: it loads two numbers, adds them, and outputs the result. But modern silicon has wide hardware registers called SIMD (Single Instruction, Multiple Data) registers. Instead of processing one equation at a time, SIMD allows the engine to pack four or eight constraint equations side by side.<br><br>The CPU executes a single electrical instruction and resolves all eight equations in the same clock cycle. It does eight times more work for the same electrical cost. This telemetry tracks how successfully constraints were processed on these hardware vector pipelines.`
        }
    }
};

function getKeywordKey(text) {
    const clean = text.toLowerCase().trim();
    if (clean.includes('x_i') || clean.includes('x_{i}') || clean === 'b1') return 'x_i';
    if (clean.includes('a_ii') || clean.includes('a_{ii}')) return 'a_ii';
    if (clean.includes('b_i') || clean.includes('b_{i}')) return 'b_i';
    if (clean.includes('a_ij') || clean.includes('a_{ij}')) return 'a_ij';
    if ((clean.includes('sum') && (clean.includes('k+1') || clean.includes('k+1}'))) || clean === 't1') return 'sum_t';
    if ((clean.includes('sum') && (clean.includes('k') || clean.includes('k}'))) || clean === 'b2') return 'sum_b';
    if (clean.includes('temporal') || clean.includes('coherencia')) return 'temporal';
    if (clean.includes('mobility') || clean.includes('movilidad')) return 'mobility';
    if (clean.includes('unbalanced') || clean.includes('desequilibrada') || clean.includes('avashisht')) return 'unbalanced';
    if (clean.includes('slip') || clean.includes('deslizamiento') || clean.includes('visthapan')) return 'slip';
    if (clean.includes('collide') || clean.includes('collision') || clean.includes('colisión')) return 'collision';
    if (clean.includes('penetration') || clean.includes('penetración')) return 'penetration';
    if (clean.includes('friction') || clean.includes('fricción')) return 'friction';
    if (clean.includes('joint') || clean.includes('articulaci')) return 'joints';
    if (clean.includes('sub_steps')) return 'sub_steps';
    if (clean.includes('iterations')) return 'iterations';
    if (clean.includes('static')) return 'static';
    if (clean.includes('inv_mass')) return 'inv_mass';
    if (clean.includes('dynamic')) return 'dynamic';
    if (clean.includes('update')) return 'update';
    if (clean.includes('constraints')) return 'constraints';
    if (clean.includes('batches')) return 'batches';
    if (clean.includes('simd')) return 'simd';
    return null;
}

function initKeywordDrawer() {
    if (document.getElementById('keyword-deepdive-drawer')) return;
    const drawer = document.createElement('div');
    drawer.id = 'keyword-deepdive-drawer';
    drawer.className = 'drawer-container';
    drawer.innerHTML = `
        <div class="drawer-backdrop" onclick="closeDrawer('keyword-deepdive-drawer')"></div>
        <div class="drawer-content">
            <div class="drawer-header">
                <h3 id="keyword-drawer-title">Deep Dive</h3>
                <button class="drawer-close-btn" onclick="closeDrawer('keyword-deepdive-drawer')">&times;</button>
            </div>
            <div id="keyword-drawer-body" class="drawer-body">
                <!-- Dynamically populated content -->
            </div>
        </div>
    `;
    document.body.appendChild(drawer);
}

function initDynamicTriggers() {
    const triggers = document.querySelectorAll('.drawer-trigger');
    triggers.forEach(trigger => {
        const target = trigger.getAttribute('data-target');
        const textHinglish = trigger.getAttribute('data-text-hinglish') || 'Explore';
        const textEnglish = trigger.getAttribute('data-text-english') || 'Explore';
        const textSpanish = trigger.getAttribute('data-text-spanish') || 'Explore';
        
        const button = document.createElement('button');
        button.className = 'drawer-trigger-btn';
        button.setAttribute('onclick', `openDrawer('${target}')`);
        button.innerHTML = `
            <span class="lang-content lang-hinglish">${textHinglish}</span>
            <span class="lang-content lang-english">${textEnglish}</span>
            <span class="lang-content lang-spanish">${textSpanish}</span>
        `;
        
        trigger.replaceWith(button);
    });
}

function initDynamicDrawers() {
    const drawers = document.querySelectorAll('.custom-drawer');
    drawers.forEach(drawer => {
        const id = drawer.id;
        
        const titleHinglish = drawer.getAttribute('data-title-hinglish') || drawer.getAttribute('data-title') || 'Deep Dive';
        const titleEnglish = drawer.getAttribute('data-title-english') || drawer.getAttribute('data-title') || 'Deep Dive';
        const titleSpanish = drawer.getAttribute('data-title-spanish') || drawer.getAttribute('data-title') || 'Deep Dive';
        
        const originalContent = drawer.innerHTML;
        
        drawer.className = 'drawer-container';
        drawer.innerHTML = `
            <div class="drawer-backdrop" onclick="closeDrawer('${id}')"></div>
            <div class="drawer-content">
                <div class="drawer-header">
                    <h3 class="lang-content lang-hinglish">${titleHinglish}</h3>
                    <h3 class="lang-content lang-english">${titleEnglish}</h3>
                    <h3 class="lang-content lang-spanish">${titleSpanish}</h3>
                    <button class="drawer-close-btn" onclick="closeDrawer('${id}')">&times;</button>
                </div>
                <div class="drawer-body">
                    ${originalContent}
                </div>
            </div>
        `;
    });
}



function updateSidebarToC() {
    try {
        const tocLinks = document.querySelectorAll('.on-this-page a');
        tocLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const targetId = href.substring(1);
                const decodedId = decodeURIComponent(targetId);
                const target = document.getElementById(decodedId) || document.getElementById(targetId);
                if (target) {
                    const langWrapper = target.closest('.lang-content');
                    const li = link.closest('li');
                    if (li) {
                        if (langWrapper && (langWrapper.style.display === 'none' || !langWrapper.classList.contains('active'))) {
                            li.style.display = 'none';
                        } else {
                            li.style.display = 'block';
                        }
                    }
                }
            }
        });
    } catch (e) {
        console.error("ToC update failed:", e);
    }
}

function switchLanguage(lang) {
    const contents = document.querySelectorAll('.lang-content');
    
    // Find currently visible content
    let activeContent = null;
    contents.forEach(el => {
        if (el.style.display === 'block' || el.classList.contains('active')) {
            activeContent = el;
        }
    });

    const targetContents = document.querySelectorAll('.lang-content.lang-' + lang);

    const performSwitch = () => {
        contents.forEach(el => {
            el.style.display = 'none';
            el.classList.remove('active');
            el.style.opacity = '0';
        });

        targetContents.forEach(el => {
            el.style.display = 'block';
            el.style.transition = 'opacity 0.25s ease-in-out';
            el.style.opacity = '0';
            // Trigger reflow to ensure display: block is registered before setting opacity
            el.offsetHeight; 
            el.classList.add('active');
            el.style.opacity = '1';
        });

        // Sync sidebar Table of Contents with visible headers
        updateSidebarToC();
    };

    if (activeContent && activeContent !== targetContents[0]) {
        // Fade out active content first
        contents.forEach(el => {
            if (el.style.display === 'block' || el.classList.contains('active')) {
                el.style.transition = 'opacity 0.2s ease-in-out';
                el.style.opacity = '0';
            }
        });
        // Wait for fade out to finish, then switch and fade in
        setTimeout(performSwitch, 200);
    } else {
        // Instant switch if no active content (first load)
        performSwitch();
    }
    
    const buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(lang)) {
            btn.classList.add('active');
        }
    });

    localStorage.setItem('preferred-language', lang);
}

function initLanguageToggle() {
    initDynamicTriggers();
    initDynamicDrawers();

    const main = document.querySelector('main');
    if (!main) return;

    const children = Array.from(main.children);
    let currentLangDiv = null;

    children.forEach(child => {
        // Skip the switch container itself
        if (child.classList.contains('lang-switch-container')) {
            return;
        }

        // Check if this is a language marker
        if (child.classList.contains('lang-marker')) {
            const lang = child.getAttribute('data-lang');
            
            if (lang === 'shared') {
                currentLangDiv = null;
                child.remove();
                return;
            }

            // Create a new language wrapper div
            currentLangDiv = document.createElement('div');
            currentLangDiv.className = 'lang-content lang-' + lang;
            currentLangDiv.style.display = 'none'; // hidden by default
            
            // Insert the wrapper right before the marker
            main.insertBefore(currentLangDiv, child);
            // Remove the marker
            child.remove();
            return;
        }

        // If we have a current wrapper, move the child into it
        if (currentLangDiv) {
            currentLangDiv.appendChild(child);
        }
    });

    // Restore selected language
    const savedLang = localStorage.getItem('preferred-language') || 'hinglish';
    switchLanguage(savedLang);

    // Filter sidebar ToC once built dynamically
    setTimeout(updateSidebarToC, 100);
}

let activeTooltip = null;
let activePressedHighlight = null;

function showTooltip(event) {
    const target = event.currentTarget;
    const text = target.getAttribute('data-tooltip');
    if (!text) return;

    const isTooltipOnly = target.classList.contains('tooltip-only');
    const ctaText = 'Click for more details';

    // Parse tooltip text to check for Physics / Game Physics sections
    let formattedText = text;
    const parts = text.split(/(?:<br\s*\/?>\s*<br\s*\/?>|&lt;br&gt;\s*&lt;br&gt;)/i);
    if (parts.length === 2) {
        const part1 = parts[0].trim();
        const part2 = parts[1].trim();
        
        // Match Physics: or Física: (case-insensitive)
        const p1Match = part1.match(/^(Physics|Física):\s*(.*)/i);
        // Match Game Physics: or Física de juegos: (case-insensitive)
        const p2Match = part2.match(/^(Game Physics|Física de juegos):\s*(.*)/i);
        
        if (p1Match && p2Match) {
            const label1 = p1Match[1];
            const desc1 = p1Match[2];
            const label2 = p2Match[1];
            const desc2 = p2Match[2];
            
            formattedText = `
                <div class="tooltip-section physics-section">
                    <span class="tooltip-label physics-label">${label1}</span>
                    <span class="tooltip-desc">${desc1}</span>
                </div>
                <div class="tooltip-divider"></div>
                <div class="tooltip-section game-physics-section">
                    <span class="tooltip-label game-physics-label">${label2}</span>
                    <span class="tooltip-desc">${desc2}</span>
                </div>
            `;
        } else {
            formattedText = `
                <div class="tooltip-section">${part1}</div>
                <div class="tooltip-divider"></div>
                <div class="tooltip-section">${part2}</div>
            `;
        }
    }

    // Create the tooltip element with explicit tex2jax_process class to force typesetting
    const tooltip = document.createElement('div');
    tooltip.className = 'keyword-tooltip-box global-tooltip tex2jax_process';
    tooltip.id = 'tgs-hover-tooltip';
    tooltip.innerHTML = `
        <div class="tooltip-body-content">${formattedText}</div>
        ${isTooltipOnly ? '' : `<div class="tooltip-click-cta">${ctaText}</div>`}
    `;
    
    // Add to body to measure size
    document.body.appendChild(tooltip);
    
    const positionTooltip = () => {
        if (!document.getElementById('tgs-hover-tooltip')) return;

        const rect = target.getBoundingClientRect();
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        
        let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
        let top = rect.top + window.scrollY - tooltipHeight - 12;
        
        // Mobile Safety Boundaries: Ensure tooltip never bleeds off the viewport edges
        const paddingSafety = 16;
        if (left < paddingSafety) {
            left = paddingSafety;
        } else if (left + tooltipWidth > window.innerWidth - paddingSafety) {
            left = window.innerWidth - tooltipWidth - paddingSafety;
        }
        
        if (rect.top - tooltipHeight - 12 < paddingSafety) {
            top = rect.bottom + window.scrollY + 12;
            tooltip.classList.add('tooltip-bottom');
        } else {
            tooltip.classList.remove('tooltip-bottom');
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        
        void tooltip.offsetHeight;
        tooltip.classList.add('tooltip-show');
    };

    // Trigger MathJax typeset if available (handles both v2 and v3)
    if (window.MathJax) {
        if (window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([tooltip]).then(() => {
                positionTooltip();
            }).catch((err) => {
                console.error("MathJax v3 Typeset Promise failed:", err);
                positionTooltip();
            });
        } else if (window.MathJax.typeset) {
            window.MathJax.typeset([tooltip]);
            positionTooltip();
        } else if (window.MathJax.Hub && window.MathJax.Hub.Queue) {
            ensureMathJaxConfigured();
            // Queue the typesetting first, and then the positioning callback using the element node
            window.MathJax.Hub.Queue(
                ["Typeset", window.MathJax.Hub, tooltip],
                positionTooltip
            );
        } else {
            positionTooltip();
        }
    } else {
        positionTooltip();
    }
    
    activeTooltip = tooltip;
    tooltip.targetNode = target;
}

function hideTooltip() {
    const existing = document.getElementById('tgs-hover-tooltip');
    if (existing) {
        existing.removeAttribute('id');
        existing.classList.remove('tooltip-show');
        const currentTooltip = existing;
        setTimeout(() => {
            if (currentTooltip.parentNode) {
                currentTooltip.remove();
            }
        }, 250);
    }
    if (activeTooltip) {
        activeTooltip = null;
    }
}

function openDrawerForKeyword(highlight) {
    // Resolve the active preferred language directly from local storage
    const lang = localStorage.getItem('preferred-language') || 'hinglish';
    
    // Resolve the keyword key
    const textContent = highlight.textContent || '';
    const key = getKeywordKey(textContent);
    
    if (key && keywordDeepDives[lang] && keywordDeepDives[lang][key]) {
        const data = keywordDeepDives[lang][key];
        
        // Populate the drawer title and content
        const titleEl = document.getElementById('keyword-drawer-title');
        titleEl.textContent = "Deep Dive: " + data.title;
        const bodyEl = document.getElementById('keyword-drawer-body');
        bodyEl.innerHTML = data.content;
        
        const openDrawerCallback = () => {
            openDrawer('keyword-deepdive-drawer');
        };

        // Trigger MathJax typeset on both title and body elements before opening the drawer
        if (window.MathJax) {
            if (window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise([titleEl, bodyEl])
                    .then(openDrawerCallback)
                    .catch(err => {
                        console.error("MathJax typesetting failed:", err);
                        openDrawerCallback();
                    });
            } else if (window.MathJax.typeset) {
                window.MathJax.typeset([titleEl, bodyEl]);
                openDrawerCallback();
            } else if (window.MathJax.Hub && window.MathJax.Hub.Queue) {
                window.MathJax.Hub.Queue(
                    ["Typeset", window.MathJax.Hub, [titleEl, bodyEl]],
                    openDrawerCallback
                );
            } else {
                openDrawerCallback();
            }
        } else {
            openDrawerCallback();
        }
    }
}

function initTooltips() {
    const isMobileTouch = () => window.matchMedia('(pointer: coarse)').matches;
    let hoverTimeout = null;

    // We listen to hover events on document body to handle dynamically added elements correctly
    document.addEventListener('mouseover', (e) => {
        if (isMobileTouch()) return; // Disable hover triggers on touch devices
        
        const highlight = e.target.closest('.keyword-highlight');
        
        // If mouse moves off the current keyword, cancel any pending show timeout
        if (!highlight || highlight !== activeTooltip?.targetNode) {
            clearTimeout(hoverTimeout);
        }
        
        // Do not show tooltip if we are actively pressing/dragging a keyword
        if (activePressedHighlight !== null) {
            return;
        }
        
        // If drawer is open, only show tooltip if hovered keyword is inside an open drawer
        if (document.body.classList.contains('drawer-open')) {
            if (!highlight || !highlight.closest('.drawer-container.open')) {
                return;
            }
        }
        
        if (highlight && highlight !== activeTooltip?.targetNode) {
            // Cancel any pending show timeout first
            clearTimeout(hoverTimeout);
            
            // Wait 300ms before showing the tooltip to prevent accidental flashes
            hoverTimeout = setTimeout(() => {
                hideTooltip();
                highlight.targetNode = highlight; // cache target reference
                showTooltip({ currentTarget: highlight });
            }, 300);
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (isMobileTouch()) return; // Disable hover triggers on touch devices
        
        const highlight = e.target.closest('.keyword-highlight');
        if (highlight && (!e.relatedTarget || !e.relatedTarget.closest('.keyword-highlight'))) {
            clearTimeout(hoverTimeout); // Cancel pending show immediately
            hideTooltip();
        }
    });

    // Mousedown to track click intent and hide tooltip immediately
    document.addEventListener('mousedown', (e) => {
        if (isMobileTouch()) return; // Ignore mousedown/mouseup logic on touch devices
        
        const highlight = e.target.closest('.keyword-highlight');
        if (highlight) {
            if (highlight.classList.contains('tooltip-only')) {
                return; // Ignore click tracking logic for tooltip-only annotations
            }
            // If drawer is open, only track click if the highlight is inside an open drawer
            if (document.body.classList.contains('drawer-open') && !highlight.closest('.drawer-container.open')) {
                return;
            }
            clearTimeout(hoverTimeout); // Cancel pending show immediately on click intent
            activePressedHighlight = highlight;
            hideTooltip(); // Hide tooltip immediately to prevent visual collision
        }
    });

    // Mouseup on document to detect drag-away and cancel click intent
    document.addEventListener('mouseup', (e) => {
        if (isMobileTouch()) return; // Ignore mousedown/mouseup logic on touch devices
        
        if (!activePressedHighlight) return;
        const highlight = e.target.closest('.keyword-highlight');
        if (highlight !== activePressedHighlight) {
            // Dragged away: reset click intent
            activePressedHighlight = null;
        }
    });

    // Click handler to open the dynamic keyword deep dive drawer or show/hide tooltip
    document.addEventListener('click', (e) => {
        // Close sidebar on mobile/split-screen if clicked outside the sidebar and not on the sidebar toggle icon
        const isSidebarOverlay = window.innerWidth <= 1024;
        if (isSidebarOverlay && document.documentElement.classList.contains('sidebar-visible')) {
            const sidebar = document.getElementById('mdbook-sidebar');
            const toggleBtn = document.getElementById('mdbook-sidebar-toggle');
            if (sidebar && !sidebar.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
                e.preventDefault();
                e.stopPropagation();
                
                const anchor = document.getElementById('mdbook-sidebar-toggle-anchor');
                if (anchor) {
                    anchor.checked = false;
                    document.documentElement.classList.remove('sidebar-visible');
                    localStorage.setItem('mdbook-sidebar', 'hidden');
                }
                return;
            }
        }

        const highlight = e.target.closest('.keyword-highlight');
        const inTooltip = e.target.closest('.keyword-tooltip-box');
        
        // 1. Hide tooltip when clicking outside both the keyword highlight and the tooltip box
        if (!highlight && !inTooltip) {
            hideTooltip();
            return;
        }

        // 2. Handle clicking the "CLICK FOR MORE DETAILS" CTA inside the tooltip
        const cta = e.target.closest('.tooltip-click-cta');
        if (cta && activeTooltip?.targetNode) {
            const targetNode = activeTooltip.targetNode;
            hideTooltip();
            openDrawerForKeyword(targetNode);
            return;
        }

        // 3. Handle clicking a keyword highlight
        if (highlight) {
            if (highlight.classList.contains('tooltip-only')) {
                if (isMobileTouch()) {
                    // Mobile: toggle tooltip on click, but never open deep dive drawer
                    if (!activeTooltip || activeTooltip.targetNode !== highlight) {
                        hideTooltip();
                        highlight.targetNode = highlight;
                        showTooltip({ currentTarget: highlight });
                    } else {
                        hideTooltip();
                    }
                }
                return;
            }

            if (isMobileTouch()) {
                // Mobile behavior: Tap once to show tooltip, tap again to open drawer
                if (!activeTooltip || activeTooltip.targetNode !== highlight) {
                    hideTooltip();
                    highlight.targetNode = highlight;
                    showTooltip({ currentTarget: highlight });
                    return; // Stop here, do not open drawer yet
                }
            } else {
                // Desktop behavior: Only open drawer if click was completed on the same keyword without dragging away
                if (activePressedHighlight !== highlight) {
                    return;
                }
                activePressedHighlight = null;
            }
            
            // Open drawer
            hideTooltip();
            openDrawerForKeyword(highlight);
        }
    });

    // Auto-hide tooltip on scroll for touch devices to prevent annotations from floating detached
    window.addEventListener('scroll', () => {
        if (isMobileTouch()) {
            hideTooltip();
        }
    }, { passive: true });
}

document.addEventListener('DOMContentLoaded', () => {
    initLanguageToggle();
    initKeywordDrawer();
    initTooltips();
    
    // Set up MutationObserver to sync Table of Contents as soon as it is rendered
    try {
        const observer = new MutationObserver((mutations) => {
            const toc = document.querySelector('.on-this-page');
            if (toc) {
                updateSidebarToC();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    } catch (e) {
        console.error("ToC MutationObserver failed:", e);
    }
});

// --- Sliding Drawer Operations ---

function openDrawer(id) {
    const drawer = document.getElementById(id);
    if (!drawer) return;
    hideTooltip(); // Hide active hover tooltip
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden'; // Disable background scrolling
    document.body.classList.add('drawer-open');
}

function closeDrawer(id) {
    const drawer = document.getElementById(id);
    if (!drawer) return;
    drawer.classList.remove('open');
    
    // Only restore body styles if there are no other open drawers
    const openDrawers = document.querySelectorAll('.drawer-container.open');
    if (openDrawers.length === 0) {
        document.body.style.overflow = ''; // Restore background scrolling
        document.body.classList.remove('drawer-open');
    }
}

// Global key down listener for closing drawers on Escape key press
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const openDrawers = document.querySelectorAll('.drawer-container.open');
        openDrawers.forEach(drawer => {
            closeDrawer(drawer.id);
        });
    }
});

// Premium Navigation System: Desktop Hover Edge Reveal & Mobile Touch Swipe Navigation
(function() {
    // Helper to trigger MathJax typesetting on preview panels
    function typesetElement(element) {
        if (!window.MathJax) return;
        if (window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([element]).catch(err => console.warn(err));
        } else if (window.MathJax.typeset) {
            window.MathJax.typeset([element]);
        } else if (window.MathJax.Hub && window.MathJax.Hub.Queue) {
            ensureMathJaxConfigured();
            window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, element]);
        }
    }

    // Trigger continuous slide-in animation on load if navigated via swipe
    const htmlEl = document.documentElement;
    const isSwipeNext = htmlEl.classList.contains('swipe-navigating-next');
    const isSwipePrev = htmlEl.classList.contains('swipe-navigating-prev');
    
    if (isSwipeNext || isSwipePrev) {
        try {
            sessionStorage.removeItem('swipe-navigating');
        } catch (e) {}
        
        const activePageEl = document.querySelector('.page');
        if (activePageEl) {
            // Force layout reflow
            void activePageEl.offsetHeight;
            
            // Remove the block class to trigger transition
            htmlEl.classList.remove('swipe-navigating-next', 'swipe-navigating-prev');
            
            // Apply the slide-in transition
            activePageEl.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            activePageEl.style.transform = 'translateX(0)';
            
            setTimeout(() => {
                activePageEl.style.transform = '';
                activePageEl.style.transition = '';
            }, 400);
        } else {
            htmlEl.classList.remove('swipe-navigating-next', 'swipe-navigating-prev');
        }
    }

    // Helper to sync language inside adjacent preview panels
    function syncPanelLanguage(panel, lang) {
        const contents = panel.querySelectorAll('.lang-content');
        contents.forEach(el => {
            if (el.classList.contains('lang-' + lang)) {
                el.style.display = 'block';
                el.classList.add('active');
                el.style.opacity = '1';
            } else {
                el.style.display = 'none';
                el.classList.remove('active');
                el.style.opacity = '0';
            }
        });
    }

    // Fetch adjacent pages asynchronously and render side panels
    function initSwipePreviews() {
        if (window.innerWidth > 1024) return; // Swipe previews only on mobile
        
        const prevLinkElement = document.querySelector('.nav-chapters.previous');
        const prevHref = prevLinkElement ? prevLinkElement.getAttribute('href') : null;
        
        const nextLinkElement = document.querySelector('.nav-chapters.next');
        const nextHref = nextLinkElement ? nextLinkElement.getAttribute('href') : null;
        
        const pageEl = document.querySelector('.page');
        if (!pageEl) return;
        
        const savedLang = localStorage.getItem('preferred-language') || 'hinglish';

        if (prevHref) {
            fetch(prevHref)
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const content = doc.querySelector('.page');
                    if (content) {
                        const prevPanel = document.createElement('div');
                        prevPanel.className = 'swipe-preview-panel swipe-prev-panel';
                        prevPanel.innerHTML = content.innerHTML;
                        syncPanelLanguage(prevPanel, savedLang);
                        pageEl.appendChild(prevPanel);
                        typesetElement(prevPanel);
                    }
                })
                .catch(err => console.warn("Failed to fetch prev page preview:", err));
        }

        if (nextHref) {
            fetch(nextHref)
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const content = doc.querySelector('.page');
                    if (content) {
                        const nextPanel = document.createElement('div');
                        nextPanel.className = 'swipe-preview-panel swipe-next-panel';
                        nextPanel.innerHTML = content.innerHTML;
                        syncPanelLanguage(nextPanel, savedLang);
                        pageEl.appendChild(nextPanel);
                        typesetElement(nextPanel);
                    }
                })
                .catch(err => console.warn("Failed to fetch next page preview:", err));
        }
    }

    // Wiggle/nudge hint on page load
    function triggerSwipeWiggleHint() {
        if (window.innerWidth > 1024) return; // Only on mobile
        
        // 1. Mark as shown immediately for ANY page load in this session.
        // This ensures that if the user starts or refreshes on another page first,
        // they won't get a wiggle if they navigate back to the landing page later.
        const wiggleShown = sessionStorage.getItem('swipe-wiggle-shown');
        sessionStorage.setItem('swipe-wiggle-shown', 'true');
        
        // Track the visited paths in sessionStorage to reliably detect page refreshes/reloads
        const currentPath = window.location.pathname;
        const lastPath = sessionStorage.getItem('swipe-last-path');
        sessionStorage.setItem('swipe-last-path', currentPath);
        
        // 2. Only run on the landing page (which has no previous page link)
        const hasPrev = !!document.querySelector('.nav-chapters.previous') || !!document.querySelector('.mobile-nav-chapters.previous');
        if (hasPrev) return; // Not the landing page, exit!
        
        // 3. Check if we have already wiggled in this session, unless this is a page reload/refresh of the landing page itself
        const isReload = (lastPath === currentPath);
        
        if (wiggleShown && !isReload) {
            return; // Already shown in this session and not a refresh, exit!
        }
        
        const pageEl = document.querySelector('.page');
        if (!pageEl) return;
        
        const hasNext = !!document.querySelector('.nav-chapters.next');
        let nudgeAmount = 0;
        if (hasNext) {
            nudgeAmount = -30;
        }
        
        if (nudgeAmount === 0) return;
        
        setTimeout(() => {
            if (document.body.classList.contains('drawer-open') || document.body.classList.contains('sidebar-visible')) {
                return;
            }

            
            pageEl.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
            pageEl.style.transform = `translateX(${nudgeAmount}px)`;
            
            setTimeout(() => {
                pageEl.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                pageEl.style.transform = 'translateX(0)';
                
                setTimeout(() => {
                    pageEl.style.transform = '';
                    pageEl.style.transition = '';
                }, 600);
            }, 350);
        }, 800);
    }


    // 1. Desktop Edge Hover Navigation Reveal Handler
    document.addEventListener('mousemove', (e) => {
        if (window.innerWidth <= 1024) return; // Only run on desktop viewports
        
        const width = window.innerWidth;
        const margin = 60; // Margin width from screen edge
        const leftArrow = document.querySelector('.nav-chapters.previous');
        const rightArrow = document.querySelector('.nav-chapters.next');
        
        // Check if sidebar is open
        const sidebarToggle = document.getElementById('mdbook-sidebar-toggle-anchor');
        const isSidebarOpen = sidebarToggle ? sidebarToggle.checked : false;
        
        // Calculate left hover zone start/end depending on sidebar visibility
        const sidebarWidth = isSidebarOpen ? 300 : 0;
        const leftZoneStart = sidebarWidth;
        const leftZoneEnd = sidebarWidth + margin;
        
        // Calculate right hover zone
        const rightZoneStart = width - margin;
        
        // Reveal or hide previous arrow
        if (leftArrow) {
            if (e.clientX >= leftZoneStart && e.clientX <= leftZoneEnd) {
                leftArrow.classList.add('reveal');
            } else {
                leftArrow.classList.remove('reveal');
            }
        }
        
        // Reveal or hide next arrow
        if (rightArrow) {
            if (e.clientX >= rightZoneStart && e.clientX <= width) {
                rightArrow.classList.add('reveal');
            } else {
                rightArrow.classList.remove('reveal');
            }
        }
    });

    // 2. Mobile Page Navigation Touch Swipe Gestures
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let currentDeltaX = 0;
    let isHorizontalSwipe = false;
    let pageEl = null;

    document.addEventListener('touchstart', (e) => {
        if (window.innerWidth > 1024) return; // Swipe is only enabled on mobile/tablet viewports
        
        // Exclude swipe trigger when drawers, tooltips, sidebar, search overlay or interactive elements are targeted
        if (document.body.classList.contains('drawer-open') || 
            document.body.classList.contains('sidebar-visible') || 
            e.target.closest('pre, code, table, .MathJax_Display, .MathJax, mjx-container, .sidebar, .drawer-container, .keyword-tooltip-box, .lang-switch-container, button, a, input, textarea, [contenteditable="true"]')) {
            return;
        }

        const startX = e.touches[0].clientX;
        const startY = e.touches[0].clientY;
        
        // iOS Native back/forward swipe compatibility: Ignore swipes starting within 20px of screen edges
        if (startX < 20 || startX > window.innerWidth - 20) {
            return;
        }

        touchStartX = startX;
        touchStartY = startY;
        touchStartTime = Date.now();
        currentDeltaX = 0;
        isHorizontalSwipe = false;
        pageEl = document.querySelector('.page');
        
        if (pageEl) {
            pageEl.style.transition = 'none';
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!pageEl) return;

        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;

        if (!isHorizontalSwipe) {
            // Determine horizontal intent: minimum X displacement of 10px and at least 2x greater than vertical displacement
            if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
                isHorizontalSwipe = true;
            }
        }

        if (isHorizontalSwipe) {
            // Prevent default vertical page scrolling when horizontal swipe is active
            if (e.cancelable) e.preventDefault();

            // Check if pages exist in respective directions
            const hasPrev = !!document.querySelector('.nav-chapters.previous');
            const hasNext = !!document.querySelector('.nav-chapters.next');

            let dragX = deltaX * 0.85; // 0.85 mass resistance factor
            // Apply rubber-banding friction factor if pulling where no adjacent page exists
            if ((deltaX > 0 && !hasPrev) || (deltaX < 0 && !hasNext)) {
                dragX = deltaX * 0.22; // stronger rubber banding for weight feel
            }

            currentDeltaX = dragX;
            pageEl.style.transform = `translateX(${dragX}px)`;
        }
    }, { passive: false });

    function handleTouchEndOrCancel(e) {
        if (!pageEl || !isHorizontalSwipe) return;

        const timeDiff = Date.now() - touchStartTime;
        const velocity = Math.abs(currentDeltaX) / timeDiff; // Pixels per millisecond
        const threshold = window.innerWidth * 0.25; // 25% of screen width

        // Snappy flick: velocity > 0.5px/ms and minimum 30px drag distance
        const isFlick = velocity > 0.5 && Math.abs(currentDeltaX) > 30;
        const isLongSwipe = Math.abs(currentDeltaX) > threshold;

        const hasPrev = !!document.querySelector('.nav-chapters.previous') || !!document.querySelector('.mobile-nav-chapters.previous');
        const hasNext = !!document.querySelector('.nav-chapters.next') || !!document.querySelector('.mobile-nav-chapters.next');

        pageEl.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';

        if ((isFlick || isLongSwipe) && currentDeltaX > 0 && hasPrev) {
            // Swipe Right -> Previous Page
            pageEl.style.transform = 'translateX(100vw)';
            const prevLinkElement = document.querySelector('.nav-chapters.previous') || document.querySelector('.mobile-nav-chapters.previous');
            const prevLink = prevLinkElement ? prevLinkElement.href : null;
            if (prevLink) {
                try {
                    sessionStorage.setItem('swipe-navigating', 'prev');
                } catch (err) {}
                setTimeout(() => {
                    window.location.href = prevLink;
                }, 300); // Wait for transition to complete
            }
        } else if ((isFlick || isLongSwipe) && currentDeltaX < 0 && hasNext) {
            // Swipe Left -> Next Page
            pageEl.style.transform = 'translateX(-100vw)';
            const nextLinkElement = document.querySelector('.nav-chapters.next') || document.querySelector('.mobile-nav-chapters.next');
            const nextLink = nextLinkElement ? nextLinkElement.href : null;
            if (nextLink) {
                try {
                    sessionStorage.setItem('swipe-navigating', 'next');
                } catch (err) {}
                setTimeout(() => {
                    window.location.href = nextLink;
                }, 300); // Wait for transition to complete
            }
        } else {
            // Snap back to starting position
            pageEl.style.transform = 'translateX(0)';
            
            // Clean up inline styles after transitions finish
            setTimeout(() => {
                if (pageEl && !isHorizontalSwipe) {
                    pageEl.style.transform = '';
                    pageEl.style.transition = '';
                }
            }, 350);
        }

        isHorizontalSwipe = false;
        pageEl = null;
    }

    document.addEventListener('touchend', handleTouchEndOrCancel, { passive: true });
    document.addEventListener('touchcancel', handleTouchEndOrCancel, { passive: true });

    // Initialize swipe preview panels and wiggle hint on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initSwipePreviews();
            triggerSwipeWiggleHint();
        });
    } else {
        initSwipePreviews();
        triggerSwipeWiggleHint();
    }
})();

// Cache bust update: Force mobile browsers to detect a new hash update


// Cache bust update: Force mobile browsers to detect a new hash update
