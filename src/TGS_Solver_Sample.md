<div class="lang-switch-container">
  <button class="lang-btn active" onclick="switchLanguage('hinglish')">Hinglish</button>
  <button class="lang-btn" onclick="switchLanguage('english')">English</button>
  <button class="lang-btn" onclick="switchLanguage('spanish')">Español</button>
</div>

<div class="lang-marker" data-lang="hinglish"></div>

<button class="drawer-trigger-btn" onclick="openDrawer('cliffhanger-drawer-hinglish')">Explore Cliffhanger Analogy</button>
<button class="drawer-trigger-btn" onclick="openDrawer('silicon-drawer-hinglish')">Inspect Silicon Telemetry</button>
### 1. Core Constraints and the Stability Problem

Jab hum kisi real-time game physics simulation me objects ko <span class="keyword-highlight" data-tooltip="Physics: Aise do ya zyada objects ka aapas me takrana jahan wo ek dusre par strong forces lagate hain aur unka total momentum conserve rehta hai.<br><br>Game Physics: Jab do objects ke colliders intersect karte hain, to engine unke overlap ko detect karke realistic bounce and impulses calculate karta hai.">collide</span> hote hue ya stacked layers me interact karte hue dekhte hain, to background me engine ko physics constraints resolve karne padte hain:

* **Collision <span class="keyword-highlight" data-tooltip="Physics: Impenetrability ka rule—asli duniya me do solid objects ek hi samay par ek hi space occupy nahi kar sakte.<br><br>Game Physics: Time-steps ke gap ki wajah se objects ek dusre ke andar 'sink' (penetrate) ho jaate hain. Engine is error ko correction impulses se solve karta hai taaki objects boundary cross na karein.">penetration</span>**: Objects ko aapas mein intersect hone se rokna.
* **<span class="keyword-highlight" data-tooltip="Physics: Do surfaces ke contact point par lagne wala resistive force jo unke relative sliding motion ko oppose karta hai.<br><br>Game Physics: Contact point ke tangent plane par lagne wala constraint jo Coulomb's Law ke base par sliding ko rokta hai, taaki objects baraf (ice) ki tarah slide na karein.">friction</span>**: Surfaces ke tangent plane par tangential resistance apply karna sliding motion ko rokne ke liye.
* **<span class="keyword-highlight" data-tooltip="Physics: Aise connections ya joints jo do rigid bodies ke beech relative movement ke degrees of freedom (DOF) ko limit karte hain (jaise joints aur hinges).<br><br>Game Physics: Joint constraints jo translation aur rotation ko limit karte hain (jaise ragdoll limbs), jise solver aapas me stretch hone se bachata hai.">articulated joints</span>**: Multiple rigid bodies ko hinge ya custom degrees of freedom (DOF) se coordinate karna.

Agar ye solver mathematically unstable ho, to high-speed movement ya heavy mass difference ke waqt simulations crash ho jayengi, objects wall ke paar 'leak' (penetrate) ho jayenge, aur joints jitter karne lagenge. Temporal Gauss-Seidel (TGS) wahi advance velocity-level iterative solver hai jo in constraints ko sub-stepping ke sath stabilise karta hai, aur dynamic forces ko smooth out karke poore simulation frame ko stability deta hai.

### 2. Mathematical Model and Simultaneous Equations

TGS solver modern physics engines ka backbone hai. Jab hum ek massive web of constraints (jaise stacked boxes ya character joints) ko balance karte hain, to pure system ko simultaneous equations ke system ki tarah solve karna hota hai. TGS is system ko step-by-step resolve karta hai. Iska mathematical basis is iterative equation par dependent hai:

\\[
x_i^{(k+1)} = \frac{1}{a_{ii}} \left( b_i - \sum_{j=1}^{i-1} a_{ij} x_j^{(k+1)} - \sum_{j=i+1}^{n} a_{ij} x_j^{(k)} \right)
\\]

Is mathematical formula ke variables ko break down karke samajhte hain:

* **<span class="keyword-highlight" data-tooltip="Yeh target coordinate element hai jise solver resolve kar raha hai. Humare cliffhanger scenario me, ye wo suspended insaan B1 hai jo edge par latka hai. Iske balance hone par hi baqi logon ka latakna depend karta hai.">\\(x_i^{(k+1)}\\)</span>**: Target object ki updated state (velocity/position correction) jo current frame \\(k+1\\) me calculate ho rahi hai.
* **<span class="keyword-highlight" data-tooltip="Yeh target coordinate element hai jise solver resolve kar raha hai. Humare cliffhanger scenario me, ye wo suspended insaan B1 hai jo edge par latka hai. Iske balance hone par hi baqi logon ka latakna depend karta hai.">x_i(k+1)</span>**: Target object ki updated state (velocity/position correction) jo current frame k+1 me calculate ho rahi hai.
* **<span class="keyword-highlight" data-tooltip="Ye effective mass ya inertia tensor value hai, jo movement ke khilaf resistance (stubbornness) dikhata hai. Cliffhanger me ye B1 ka apna weight aur edge ke sath grip friction resistance hai.">a_ii</span>**: Effective mass ya diagonal elements of the system matrix jo object ke dynamic resistance ko define karte hain.
* **<span class="keyword-highlight" data-tooltip="Ye target object par lagne wala pure external force hai. Cliffhanger me ye B1 ka apna isolated weight hai (mass multiplied by gravity) jo use niche khinch raha hai.">b_i</span>**: External biases vector (gravity, collision impulses, external damping, and penetration error parameters).
* **<span class="keyword-highlight" data-tooltip="Ye T-array hai, yaani cliff ke upar khade log [T3, T2, T1] jo B1 ko upar khinch rahe hain. Kyunki CPU inko pehle hi process kar chuka hai, inki states updated k+1 hain.">Sum of (a_ij * x_j(k+1))</span>**: Un neighbor components ka collective pulling force jo current iteration cycle me already process ho chuke hain, isliye inke paas updated present state k+1 hai.
* **<span class="keyword-highlight" data-tooltip="Ye B-array hai, yaani B1 ke niche latakte hue log [B2, B3] jo use niche drag kar rahe hain. CPU abhi tak in tak nahi pahuncha, isliye ye pichli state k carry karte hain.">Sum of (a_ij * x_j(k))</span>**: Un neighbor constraints ka pull jahan current sweep abhi tak nahi pahuncha hai, isliye ye pichli state k carry karte hain.
* **<span class="keyword-highlight" data-tooltip="Ye coupling coefficients hain jo stiffness represent karte hain. Cliffhanger me ye haath ki pakad (grip stiffness) hai jo force transfer karti hai.">a_ij</span>**: Coupling coefficients jo adjacent elements ke beech structural stiffness represent karte hain.

### 3. The Role of Temporal Coherence

Lekin is heavy, sequential chain-reaction ko CPU cycles exhaust karne se bachane ke liye, yeh 'Time' (Temporal) ka element inject karta hai. Kaise? Pichle frame ke final physics state ko recycle karke aur use naye frame ke liye initial guess ki tarah use karke. Chunki objects 1/60th of a second me na ke barabar move karte hain, toh ye <span class="keyword-highlight" data-tooltip="Solver pichle frame ki final state ko naye frame ke starting point ki tarah reuse karta hai. Chunki ek second ke 60th part me objects bohot kam move hote hain, ye shortcut CPU ke dozens of loops bacha leta hai aur system ko stability deta hai.">Temporal Coherence</span> shortcut dozens of calculation loops ko bacha leta hai aur complex physical webs ko stabilize kar deta hai.

Agar hum TGS formula ko dhyan se dekhein, toh solver basically array me se ek single object ko isolate kar raha hota hai. Saare surrounding forces ko hata kar, ye sirf us specific object ke inertia (mass) aur external gravity par focus karta hai.

Isliye, formula is inertia ko reverse kar deta hai, yaani use ulta kar deta hai: 1/a_ii. Aur inertia ke is inverse ko hum <span class="keyword-highlight" data-tooltip="Mass aur inertia stubbornness hai—yaani movement ke khilaf resistance. Par physics constraint ko resolve karne ke liye hume movement chahiye. Isliye, formula is resistance ko invert (ulta) kar deta hai: 1/a_ii. Isi value ko hum Mobility kehte hain jo constraint slip ko calculate karne ke kaam aati hai.">Mobility</span> kehte hain.

Main bracket ke andar jo sabse pehla term hai, wo hai b_i. Ye strictly target object ka apna isolated weight hai (uska mass multiplied by gravity) jo use niche khinch raha hai. To CPU karta kya hai? Wo bracket ke andar b_i (target object ki gravity) me se un dono Sigmas (upar aur niche wale elements ke pull) ko subtract karta hai. Subtraction ke baad jo bachta hai, jise hum <span class="keyword-highlight" data-tooltip="Maniye target object ki apni gravity aur niche wale elements ka pull milkar total 100 force niche lagate hain. Aur upar khinchne wala element sirf 90 force se upar khinch raha hai. Jab hum subtract karenge (100 minus 90), to hamare paas 10 downward force bachega. Yahi bacha hua force hamara Unbalanced Force hai jo dikhata hai ki object balance me nahi hai.">Unbalanced Force</span> yaani Residual kehte hain.

Is Unbalanced Force ki wajah se target object apni position badlega. To CPU object ki Mobility ko is Unbalanced Force se multiply karta hai:

\\[
\text{Mobility } \left(\frac{1}{a_{ii}}\right) \times \text{Unbalanced Force}
\\]

Is multiplication ke waqt hi constraint coordinates slip hote hain. Ye <span class="keyword-highlight" data-tooltip="Ye slip koi random error nahi hai. Ye us bache hue force ki wajah se hone wala actual physical displacement hai. Driven entirely by math, object grid par slide karke aisi nayi position par jata hai jahan saare forces cancel ho jayein. Yahi nayi position hume x_i(k+1) deti hai.">Slip</span> koi error nahi hai, balki us bache hue force ki wajah se hone wala displacement hai. Math ke hisab se coordinates slide karke aisi nayi position par jayenge jahan saare forces cancel ho jayein. Yahi nayi position hamara final output hoti hai.

<div id="cliffhanger-drawer-hinglish" class="drawer-container">
  <div class="drawer-backdrop" onclick="closeDrawer('cliffhanger-drawer-hinglish')"></div>
  <div class="drawer-content">
    <div class="drawer-header">
      <h3>Deep Dive: The Cliffhanger Analogy</h3>
      <button class="drawer-close-btn" onclick="closeDrawer('cliffhanger-drawer-hinglish')">&times;</button>
    </div>
    <div class="drawer-body">

<h4>Hanging Chain Analogy and Solver Mapping</h4>

<p>Gauss-Seidel relaxation ke sequential calculations ko visual terms mein samajhne ke liye, aaiye ek cliffhanger situation ko deconstruct karte hain jahan chhe (6) log ek chain bana kar latak rahe hain:</p>

<h5>1. The Anchoring Group (Top Array: T3, T2, T1)</h5>
<ul>
  <li><strong>T3 (Static Ground Anchor)</strong>: Yeh zameen par firmly anchor hai aur bilkul nahi hilta. Physics engine mein yeh <code>BodyType::Static</code> aur zero inverse mass (<code>inv_mass = 0.0</code>) ko map karta hai. Yeh chain ko base strength deta hai.</li>
  <li><strong>T2 aur T1 (Intermediate Nodes)</strong>: T3 se jude dynamic links jo B1 ko hold karne ke liye tension support de rahe hain. Kyunki solver matrix sweep mein inko sequence mein pehle execute kar chuka hai, inki states updated frame calculations (\\(k+1\\)) ko carry karti hain.</li>
</ul>

<h5>2. The Hanging Chain (Bottom Array: B1, B2, B3)</h5>
<ul>
  <li><strong>B1 (The Interface Node)</strong>: Yeh first hanging person (<span class="keyword-highlight" data-tooltip="Yeh mathematical equation ka focus element x_i(k+1) hai. CPU is target body ko matrix sweep ke waqt isolate karta hai taake local balance find kiya ja sake.">B1</span>) hai jo edge ke exact contact point par hai. Mathematically, solver is target object coordinates (\\(x_i^{(k+1)}\\)) ko sweep ke waqt isolate karta hai. Pure structure ki stability B1 ke adjustment par depend karti hai.</li>
  <li><strong>B2 (Middle Connector)</strong>: B1 ke pair pakde hue middle link (<span class="keyword-highlight" data-tooltip="Ye equation ka Dusra Sigma (j = i+1 to n) represent karta hai. Ye wo connected rigid bodies hain jo target body ke baad aati hain aur purani state k carry karti hain.">B2</span>) jo tension balance transfer kar raha hai.</li>
  <li><strong>B3 (Terminal Hanging Node)</strong>: Sabse last link jis par downward gravity pull accumulate ho rahi hai. Ye aur B2 abhi step calculations ke sweep process mein update nahi hue hain, isliye inki state past iteration index (\\(k\\)) se read ki ja rahi hai.</li>
</ul>

<h5>3. Force Balancing and Coordinate Slip</h5>
<p>B1 ko target coordinate system ke rules ke mutabik local balance (equilibrium) maintain karna hai:</p>
<ul>
  <li><strong>Residual Tension Calculation</strong>: B1 ko upar se milne wala pull (T-array value 90) aur niche se milne wala total drag force (B-array aur B1 ka physical weight 100) compare kiya jata hai. In dono ke subtraction se balance deviation output 10 nikalta hai, jise mathematical residual (Unbalanced Force) kehte hain.</li>
  <li><strong>Impulsive Slip Adjustment</strong>: B1 ko is 10 tension difference ko absorb karne ke liye horizontal plane par static coordinates slide karne padenge taaki forces cancel mo sakein. Yahi actual correction calculation is element ka final coordinate coordinates slip kehlata hai, jo updated dynamic position value (\\(x_i^{(k+1)}\\)) banata hai.</li>
</ul>

</div>
</div>
</div>

<div id="silicon-drawer-hinglish" class="drawer-container">
  <div class="drawer-backdrop" onclick="closeDrawer('silicon-drawer-hinglish')"></div>
  <div class="drawer-content">
    <div class="drawer-header">
      <h3>Deep Dive: Silicon-Level Verification</h3>
      <button class="drawer-close-btn" onclick="closeDrawer('silicon-drawer-hinglish')">&times;</button>
    </div>
    <div class="drawer-body">

<h4>Silicon-Level Telemetry and Execution Logic</h4>

<p>Hum mathematical coordinates aur physics variables ki verification directly Rust physics code aur silicon-level logic outputs ke zariye kar sakte hain:</p>

<pre class="language-rust"><code class="language-rust">
let mut config = PhysicsConfig::default();
config.<span class="keyword-highlight" data-tooltip="The number of sub-intervals we split a single 1/60s frame into (the temporal aspect of the solver).">sub_steps</span> = 4;
config.<span class="keyword-highlight" data-tooltip="The number of Gauss-Seidel relaxation passes we run per sub-step.">iterations</span> = 12;

let mut world = PhysicsWorld::new(config);
let shape = Collider::Box(BoxShape::new(0.5, 0.5, 0.5));

let mut t3 = RigidBody::new(Vector3::new(0.0, 0.0, 0.0), shape);
t3.body_type = <span class="keyword-highlight" data-tooltip="A rigid body that never moves, representing an infinite mass anchor (like the cliff/ground).">BodyType::Static</span>;
t3.mass_props.<span class="keyword-highlight" data-tooltip="Setting inverse mass to zero mathematically means infinite mass. It cannot move.">inv_mass</span> = 0.0;
world.add_body(t3); // T3 Anchor

let mut t2 = RigidBody::new(Vector3::new(0.0, 1.0, 0.0), shape);
t2.body_type = <span class="keyword-highlight" data-tooltip="A rigid body affected by gravity and impulses (like the hanging people).">BodyType::Dynamic</span>;
world.add_body(t2); // T2

let mut t1 = RigidBody::new(Vector3::new(0.0, 2.0, 0.0), shape);
t1.body_type = BodyType::Dynamic;
world.add_body(t1); // T1

let mut b1 = RigidBody::new(Vector3::new(0.0, 3.0, 0.0), shape);
b1.body_type = BodyType::Dynamic;
let b1_handle = world.add_body(b1); // B1 Focus

let mut b2 = RigidBody::new(Vector3::new(0.0, 4.0, 0.0), shape);
b2.body_type = BodyType::Dynamic;
world.add_body(b2); // B2

let mut b3 = RigidBody::new(Vector3::new(0.0, 5.0, 0.0), shape);
b3.body_type = BodyType::Dynamic;
world.add_body(b3); // B3

world.<span class="keyword-highlight" data-tooltip="The main entry point that runs collision detection and calls the TGS solver to update positions.">update</span>(1.0 / 60.0, None, None);
</code></pre>

<h5>Execution Telemetry Log</h5>
<p>Niche setup runtime code se generated terminal outputs display kiye gaye hain jo update cycle trace karte hain:</p>

<pre><code class="language-text">
--- TITAN ENGINE: SILICON-LEVEL TGS SOLVER DEMONSTRATION ---
Initial Setup Complete. B1 is sandwiched between T1 (Below) and B2 (Above).
B1 Initial Position Y: 3.0000
B1 Initial Velocity Y: 0.0000

Executing 1 Frame (dt = 0.0166)...
[SOLVE_TGS] Entry: <span class="keyword-highlight" data-tooltip="The 5 joints connecting the 6 bodies in our cliffhanger chain.">constraints=5</span>, <span class="keyword-highlight" data-tooltip="Parallel execution batches to resolve independent constraints.">batches=2</span>, bodies=5, iterations=12, <span class="keyword-highlight" data-tooltip="Constraints resolved using SIMD lane vectorization for hardware speed.">total_simd_constraints=2</span>

B1 Final Position Y: 3.000041
B1 Final Velocity Y: 0.003417
B1 Total 'Slip' (Displacement due to gravity and constraint resolution): 0.000041
------------------------------------------------------------
</code></pre>

<h5>Why TGS is Standard in Modern Real-Time Physics Engines</h5>
<p>Modern physics engines old Projected Gauss-Seidel (PGS) architecture ke bajaye TGS pipeline use karte hain. Is structural shift ke details niche breakdown kiye gaye hain:</p>

<ul>
  <li><strong>The Stretching Problem (PGS Limitations)</strong>: Traditional PGS engine iterations ko poore 16ms frame timestep ke flat scale par resolve karta hai. Jab constraints ki segment chain badi ho (jaise ragdoll limbs ya rope bridges), to errors dynamically stack up hote hain aur joints stretch hokar unstable visual vibration (rubber-band jitter) dikhate hain.</li>
  <li><strong>The Substepping Solution (TGS Approach)</strong>: TGS execution flow pure timestep cycle ko multiple discrete sub-steps mein split karta hai. Har iteration loop ko internal mini sub-step ki tarah perform kiya jata hai:
    <ul>
      <li>Calculated impulses delta values ko global delta velocity buffer mein accumulate kiya jata hai.</li>
      <li>Joint coordinate positions ko mid-frame update kiya jata hai aur Jacobian coefficients recalculate hote hain.</li>
      <li>Friction model ko normal forces ke overlap correction ke saath dynamically compile kiya jata hai (sliding like ice check prevent karne ke liye).</li>
    </ul>
  </li>
</ul>

</div>
</div>
</div>

Yahi mathematical stability aur constraint relaxation ka core principle hai jo modern physics pipelines ko support karta hai. Har frame me mathematical calculations silently execute hoti hain, computational errors ko smooth out karti hain aur physics simulator ko dynamic environments me stability aur integrity deti hain.

<div class="lang-marker" data-lang="english"></div>

<button class="drawer-trigger-btn" onclick="openDrawer('cliffhanger-drawer-english')">Explore Cliffhanger Analogy</button>
<button class="drawer-trigger-btn" onclick="openDrawer('silicon-drawer-english')">Inspect Silicon Telemetry</button>

### 1. Core Constraints and the Stability Problem

In a real-time game physics simulation, when bodies <span class="keyword-highlight" data-tooltip="Physics: A physical phenomenon where two or more bodies exert strong forces on each other in a brief interval, changing their velocities and conserving total momentum.<br><br>Game Physics: The event when two shape colliders overlap. The engine detects this and applies normal impulses to make them bounce off realistically.">collide</span> or interact in complex stacks, the engine must resolve a dense network of physical constraints:

* **Collision <span class="keyword-highlight" data-tooltip="Physics: The principle of impenetrability of matter—two solid physical bodies cannot occupy the same space at the same time.<br><br>Game Physics: Due to discrete time-steps, objects can sink into each other between frames. The engine pushes them apart using positional corrections (e.g., Baumgarte stabilization) to prevent clipping.">penetration</span>**: Preventing objects from intersecting or clipping through each other.
* **<span class="keyword-highlight" data-tooltip="Physics: The resistive force acting tangentially at the contact boundary that opposes the relative sliding motion of two surfaces in contact.<br><br>Game Physics: A constraint solved along the contact plane that limits tangential impulses using Coulomb's Law, preventing objects from sliding indefinitely as if on ice.">friction</span>**: Applying tangential resistance along the contact plane to prevent relative sliding motion.
* **<span class="keyword-highlight" data-tooltip="Physics: Mechanical links or hinges that connect rigid bodies, restricting their relative degrees of freedom (DOF) to allow specific motions (like rotation) while preventing others.<br><br>Game Physics: Coupled constraint networks representing joints (like ragdoll limbs) solved iteratively to prevent stretching or tearing under stress.">articulated joints</span>**: Restricting the relative degrees of freedom (DOF) between multiple rigid bodies through hinges, sliders, or custom limits.

If the constraint solver is mathematically unstable, high-velocity impacts or massive weight disparities will cause the simulation to jitter, objects to clip through boundaries, or the system to explode. The Temporal Gauss-Seidel (TGS) solver is a velocity-level iterative engine that employs sub-stepping and temporal history to resolve these constraint equations smoothly, preventing numerical drift and preserving structural stability in dynamic environments.

### 2. Mathematical Model and Simultaneous Equations

The Temporal Gauss-Seidel (TGS) solver is a fundamental algorithm in rigid body physics simulation. When solving large systems of physical constraints (such as stacked boxes or ragdoll joints), the engine formulates a global system of equations representing the impulses required to satisfy all constraints. TGS approximates the solution by sweeping through these constraints iteratively. The mathematical foundation of this relaxation method is governed by:

 \\[
x_i^{(k+1)} = \frac{1}{a_{ii}} \left( b_i - \sum_{j=1}^{i-1} a_{ij} x_j^{(k+1)} - \sum_{j=i+1}^{n} a_{ij} x_j^{(k)} \right)
\\]

Let us break down the variables in this equation to understand its mechanical implementation:

* **<span class="keyword-highlight" data-tooltip="This is the target element being resolved by the solver. In our cliffhanger analogy, it represents B1, who is suspended in the air. The balance of the entire chain below depends on B1.">\\(x_i^{(k+1)}\\)</span>**: The target coordinate element (velocity/position correction) being updated for the active constraint at the current iteration step \\(k+1\\).
* **<span class="keyword-highlight" data-tooltip="This is the effective mass or inertia tensor value, showing resistance to movement. In the cliffhanger analogy, this maps to B1's weight and grip friction.">\\(a_{ii}\\)</span>**: The diagonal element of the system matrix representing the effective mass of the joint or contact, defining the inertial resistance to constraint corrections.
* **<span class="keyword-highlight" data-tooltip="This is the pure external force acting on the target object. In the analogy, it represents B1's own isolated gravity pulling him down.">\\(b_i\\)</span>**: The external bias vector containing accumulated gravity, initial velocities, compliance terms, and penetration error correction parameters (Baumgarte stabilization).
* **<span class="keyword-highlight" data-tooltip="This is the T-array—the people standing on top of the cliff pulling up. Since the CPU already solved these upper elements, they have the updated present state k+1.">\\(\sum_{j=1}^{i-1} a_{ij} x_j^{(k+1)}\\)</span>**: The cumulative forces from neighboring constraints that have already been processed in the current sweep, utilizing their updated present state \\(k+1\\).
* **<span class="keyword-highlight" data-tooltip="This is the B-array—the people hanging below dragging down. Since the CPU hasn't reached them yet in this loop, they carry the past state k.">\\(\sum_{j=i+1}^{n} a_{ij} x_j^{(k)}\\)</span>**: The forces from neighboring constraints that have not yet been reached in this sweep, relying on their historical state \\(k\\) from the previous iteration.
* **<span class="keyword-highlight" data-tooltip="This is the coupling coefficient representing grid stiffness. In the analogy, it maps to the grip strength between characters.">\\(a_{ij}\\)</span>**: The coupling coefficients that define the structural stiffness and transmission of forces between adjacent coordinates.

### 3. The Role of Temporal Coherence

To prevent this heavy, sequential chain-reaction from exhausting CPU cycles, the solver injects a time-based shortcut. It recycles the final constraint forces (impulses) calculated in the previous frame and applies them as an initial guess for the new frame. Since objects move very little in 1/60th of a second, this <span class="keyword-highlight" data-tooltip="Instead of starting from scratch on every frame, the solver recycles the final physics state from the previous frame as the starting guess for the new one. Since objects barely move in a fraction of a second, this trick saves dozens of calculation loops and keeps things stable.">Temporal Coherence</span> shortcut saves dozens of iteration loops and stabilizes complex constraint webs.

If we analyze the TGS mathematical structure, we see that the solver isolates a single constraint in the system. It filters out surrounding forces to focus on the target object's inertia (effective mass) and external biases.

To calculate the necessary correction, the formula utilizes the inverse of the effective mass: \\(1 / a_{ii}\\). In physics simulations, this inverse value represents <span class="keyword-highlight" data-tooltip="Mass and inertia mean stubbornness—how much an object resists moving. But to solve constraints, we want movement, not stubbornness. So, the math flips this inertia upside down: 1/a_ii. The inverse of inertia is what we call Mobility.">Mobility</span>, which dictates how easily the coordinates can shift.

Inside the bracket, the solver starts with the isolated external force bias \\(b_i\\) and subtracts both summation terms (the pulls from above and below). The remaining value is the <span class="keyword-highlight" data-tooltip="Say B1's weight and the pull from the guys below equal 100 force pulling down. The person above pulls up with a force of 90. When we subtract, we have a net downward force of 10. That net force is our Unbalanced Force. It means B1 is not balanced.">Unbalanced Force</span>, also known as the solver residual.

The solver then multiplies the target object's Mobility by this Unbalanced Force:

\\[
\text{Mobility } \left(\frac{1}{a_{ii}}\right) \times \text{Unbalanced Force}
\\]

This multiplication determines the precise coordinate shift required to eliminate the force imbalance. This <span class="keyword-highlight" data-tooltip="This slip isn't a bug. It's the physical movement caused by that net force of 10. The math drives B1's hand to slide to a new spot where all forces cancel out. That new, stable position is our final output: x_i(k+1).">Slip</span> is not a numerical error, but the deliberate physical displacement that brings the system into local equilibrium. Through this math, coordinates slide to a stable position where all forces cancel out, yielding \\(x_i^{(k+1)}\\).

<div id="cliffhanger-drawer-english" class="drawer-container">
  <div class="drawer-backdrop" onclick="closeDrawer('cliffhanger-drawer-english')"></div>
  <div class="drawer-content">
    <div class="drawer-header">
      <h3>Deep Dive: The Cliffhanger Analogy</h3>
      <button class="drawer-close-btn" onclick="closeDrawer('cliffhanger-drawer-english')">&times;</button>
    </div>
    <div class="drawer-body">

<h4>Hanging Chain Analogy and Solver Mapping</h4>

<p>To understand the sequential calculations of Gauss-Seidel relaxation in visual terms, let us deconstruct a cliffhanger scenario where six people hang in a chain off a cliff edge:</p>

<h5>1. The Anchoring Group (Top Array: T3, T2, T1)</h5>
<ul>
  <li><strong>T3 (Static Ground Anchor)</strong>: Anchored firmly to the ground, this node cannot move. In a physics engine, this maps to a body of <code>BodyType::Static</code> with an inverse mass of zero (<code>inv_mass = 0.0</code>), providing the ultimate anchor for the chain.</li>
  <li><strong>T2 and T1 (Intermediate Nodes)</strong>: Dynamic bodies linked to T3, holding the tension supporting B1. Because the solver's matrix sweep processes them first, they carry updated present-state calculations (\\(k+1\\)).</li>
</ul>

<h5>2. The Hanging Chain (Bottom Array: B1, B2, B3)</h5>
<ul>
  <li><strong>B1 (The Interface Node)</strong>: The first hanging person (<span class="keyword-highlight" data-tooltip="This is the target element being resolved by the solver. In our cliffhanger analogy, it represents B1, who is suspended in the air. The balance of the entire chain below depends on B1.">B1</span>) positioned exactly at the cliff edge. Mathematically, the solver isolates these target coordinates (\\(x_i^{(k+1)}\\)) during its sweep. The stability of the entire chain rests on B1's local adjustment.</li>
  <li><strong>B2 (Middle Connector)</strong>: The middle link (<span class="keyword-highlight" data-tooltip="This is the B-array—the people hanging below dragging down. Since the CPU hasn't reached them yet in this loop, they carry the past state k.">B2</span>) holding B1's legs, transmitting the tension balance downwards.</li>
  <li><strong>B3 (Terminal Hanging Node)</strong>: The final link in the chain bearing the fully accumulated gravity pull. B3 and B2 have not yet been updated in the current sweep, so their states are read from the past iteration index (\\(k\\)).</li>
</ul>

<h5>3. Force Balancing and Coordinate Slip</h5>
<p>B1 must maintain local equilibrium according to the rules of the coordinate system:</p>
<ul>
  <li><strong>Residual Tension Calculation</strong>: The upward pull from the top array (T-array value of 90) is compared against the downward drag from the bottom array and B1's own weight (accumulating to 100). Subtracting these gives a tension discrepancy of 10, representing the mathematical residual (Unbalanced Force).</li>
  <li><strong>Impulsive Slip Adjustment</strong>: To absorb this residual tension of 10, B1 must slide his coordinates along the contact plane until the forces cancel. This correction constitutes the coordinate slip, resulting in the updated dynamic velocity and position value (\\(x_i^{(k+1)}\\)).</li>
</ul>

</div>
</div>
</div>

<div id="silicon-drawer-english" class="drawer-container">
  <div class="drawer-backdrop" onclick="closeDrawer('silicon-drawer-english')"></div>
  <div class="drawer-content">
    <div class="drawer-header">
      <h3>Deep Dive: Silicon-Level Verification</h3>
      <button class="drawer-close-btn" onclick="closeDrawer('silicon-drawer-english')">&times;</button>
    </div>
    <div class="drawer-body">

<h4>Silicon-Level Telemetry and Execution Logic</h4>

<p>We can verify mathematical coordinates and physics variables directly using Rust physics implementation and silicon-level execution trace logs:</p>

<pre class="language-rust"><code class="language-rust">
let mut config = PhysicsConfig::default();
config.<span class="keyword-highlight" data-tooltip="The number of sub-intervals we split a single 1/60s frame into (the temporal aspect of the solver).">sub_steps</span> = 4;
config.<span class="keyword-highlight" data-tooltip="The number of Gauss-Seidel relaxation passes we run per sub-step.">iterations</span> = 12;

let mut world = PhysicsWorld::new(config);
let shape = Collider::Box(BoxShape::new(0.5, 0.5, 0.5));

let mut t3 = RigidBody::new(Vector3::new(0.0, 0.0, 0.0), shape);
t3.body_type = <span class="keyword-highlight" data-tooltip="A rigid body that never moves, representing an infinite mass anchor (like the cliff/ground).">BodyType::Static</span>;
t3.mass_props.<span class="keyword-highlight" data-tooltip="Setting inverse mass to zero mathematically means infinite mass. It cannot move.">inv_mass</span> = 0.0;
world.add_body(t3); // T3 Anchor

let mut t2 = RigidBody::new(Vector3::new(0.0, 1.0, 0.0), shape);
t2.body_type = <span class="keyword-highlight" data-tooltip="A rigid body affected by gravity and impulses (like the hanging people).">BodyType::Dynamic</span>;
world.add_body(t2); // T2

let mut t1 = RigidBody::new(Vector3::new(0.0, 2.0, 0.0), shape);
t1.body_type = BodyType::Dynamic;
world.add_body(t1); // T1

let mut b1 = RigidBody::new(Vector3::new(0.0, 3.0, 0.0), shape);
b1.body_type = BodyType::Dynamic;
let b1_handle = world.add_body(b1); // B1 Focus

let mut b2 = RigidBody::new(Vector3::new(0.0, 4.0, 0.0), shape);
b2.body_type = BodyType::Dynamic;
world.add_body(b2); // B2

let mut b3 = RigidBody::new(Vector3::new(0.0, 5.0, 0.0), shape);
b3.body_type = BodyType::Dynamic;
world.add_body(b3); // B3

world.<span class="keyword-highlight" data-tooltip="The main entry point that runs collision detection and calls the TGS solver to update positions.">update</span>(1.0 / 60.0, None, None);
</code></pre>

<h5>Execution Telemetry Log</h5>
<p>Below is the runtime terminal output showing the progress of a simulation update frame:</p>

<pre><code class="language-text">
--- TITAN ENGINE: SILICON-LEVEL TGS SOLVER DEMONSTRATION ---
Initial Setup Complete. B1 is sandwiched between T1 (Below) and B2 (Above).
B1 Initial Position Y: 3.0000
B1 Initial Velocity Y: 0.0000

Executing 1 Frame (dt = 0.0166)...
[SOLVE_TGS] Entry: <span class="keyword-highlight" data-tooltip="The 5 joints connecting the 6 bodies in our cliffhanger chain.">constraints=5</span>, <span class="keyword-highlight" data-tooltip="Parallel execution batches to resolve independent constraints.">batches=2</span>, bodies=5, iterations=12, <span class="keyword-highlight" data-tooltip="Constraints resolved using SIMD lane vectorization for hardware speed.">total_simd_constraints=2</span>

B1 Final Position Y: 3.000041
B1 Final Velocity Y: 0.003417
B1 Total 'Slip' (Displacement due to gravity and constraint resolution): 0.000041
------------------------------------------------------------
</code></pre>

<h5>Why TGS is Standard in Modern Real-Time Physics Engines</h5>
<p>Modern game physics engines rely on the Temporal Gauss-Seidel (TGS) pipeline rather than the traditional Projected Gauss-Seidel (PGS) architecture. Let us look at the technical reasons behind this architectural transition:</p>

<ul>
  <li><strong>The Stretching Problem (PGS Limitations)</strong>: Traditional PGS resolves constraints at the scale of the full 16ms frame timestep. When handling deep chain structures (such as ragdoll joints or rope bridges), errors accumulate globally, causing joints to stretch unnaturally and jitter visually (rubber-band effect).</li>
  <li><strong>The Substepping Solution (TGS Approach)</strong>: TGS divides the full timestep into multiple discrete sub-steps. Each relaxation pass operates as an internal mini sub-step:
    <ul>
      <li>Calculated constraint impulses are accumulated in a global delta velocity buffer.</li>
      <li>Joint coordinate positions are updated mid-frame, causing the engine to recalculate Jacobians and effective masses before the next step.</li>
      <li>Friction forces are solved interactively within each sub-step alongside penetration corrections, ensuring stable limits.</li>
    </ul>
  </li>
</ul>

</div>
</div>
</div>

This fundamental principle of constraint relaxation and mathematical stability is what anchors modern physics pipelines. Behind the scenes, these mathematical equations execute silently in every frame, smoothing out numerical errors and ensuring the structural integrity of the simulation in highly dynamic environments.

<div class="lang-marker" data-lang="spanish"></div>

<button class="drawer-trigger-btn" onclick="openDrawer('cliffhanger-drawer-spanish')">Explore Cliffhanger Analogy</button>
<button class="drawer-trigger-btn" onclick="openDrawer('silicon-drawer-spanish')">Inspect Silicon Telemetry</button>

### 1. Restricciones principales y el problema de estabilidad

Cuando vemos interactuar cuerpos en <span class="keyword-highlight" data-tooltip="Física: Un fenómeno físico donde dos o más cuerpos ejercen fuerzas intensas entre sí en un intervalo breve, alterando sus velocidades y conservando el momento total.<br><br>Física de juegos: El evento cuando dos formas de colisión se superponen; el motor lo detecta y aplica impulsos normales para forzar la no-superposición (condiciones de Signorini) preservando la energía.">colisión</span> o en pilas complejas en una simulación de física de juego en tiempo real, el motor debe resolver una red densa de restricciones físicas:

* **<span class="keyword-highlight" data-tooltip="Física: El principio de impenetrabilidad de la materia: dos cuerpos sólidos no pueden ocupar el mismo espacio al mismo tiempo.<br><br>Física de juegos: Debido a pasos de tiempo discretos, los objetos pueden hundirse entre sí; el motor usa métodos de proyección (estabilización de Baumgarte o subpasos TGS) para aplicar correcciones posicionales que separan la geometría superpuesta.">penetración</span> de colisiones**: Evitar que los objetos se interpenetren o atraviesen entre sí.
* **<span class="keyword-highlight" data-tooltip="Física: La fuerza resistiva que actúa tangencialmente en el límite de contacto y que se opone al deslizamiento relativo entre dos superficies.<br><br>Física de juegos: Una restricción resuelta en el plano de contacto usando el cono de fricción de Coulomb, donde el motor limita los impulsos tangenciales (F_t <= mu * F_n) para evitar el deslizamiento excesivo y asegurar comportamientos de adherencia.">fricción</span>**: Aplicar resistencia tangencial a lo largo del plano de contacto para oponerse al deslizamiento relativo.
* **<span class="keyword-highlight" data-tooltip="Física: Enlaces mecánicos o articulaciones que conectan cuerpos rígidos, limitando sus grados de libertad (DOF) relativos para permitir movimientos específicos mientras previenen otros.<br><br>Física de juegos: Redes de restricciones acopladas (matrices Jacobianas) que limitan el movimiento lineal y angular relativo entre cuerpos conectados; estas se resuelven de forma iterativa para evitar desgarros o colapso estructural.">articulaciones articuladas</span>**: Limitar los grados de libertad (DOF) relativos entre múltiples cuerpos rígidos mediante bisagras, deslizadores o límites personalizados.

Si el resolvedor de restricciones es matemáticamente inestable, los impactos de alta velocidad o las disparidades de masa extremas harán que la simulación vibre, que los objetos atraviesen los límites o que el sistema explote. El resolvedor Temporal Gauss-Seidel (TGS) es un motor iterativo a nivel de velocidad que emplea subpasos y coherencia temporal para resolver estas ecuaciones de restricción de manera uniforme, lo que evita la deriva numérica y preserva la estabilidad estructural en entornos dinámicos.

### 2. Modelo matemático y ecuaciones simultáneas

El resolvedor Temporal Gauss-Seidel (TGS) es un algoritmo fundamental en la simulación física de cuerpos rígidos. Al resolver grandes sistemas de restricciones físicas (como cajas apiladas o articulaciones de ragdolls), el motor formula un sistema global de ecuaciones que representa los impulsos necesarios para satisfacer todas las restricciones. TGS aproxima la solución recorriendo estas restricciones de forma iterativa. La base matemática de este método de relajación se define mediante:

 \\[
x_i^{(k+1)} = \frac{1}{a_{ii}} \left( b_i - \sum_{j=1}^{i-1} a_{ij} x_j^{(k+1)} - \sum_{j=i+1}^{n} a_{ij} x_j^{(k)} \right)
\\]

Desglosemos las variables de esta ecuación para comprender su implementación mecánica:

* **<span class="keyword-highlight" data-tooltip="Este es el elemento objetivo siendo resuelto por el resolvedor. En la analogía del acantilado, representa a B1, quien está suspendido en el aire. El equilibrio de la cadena depende de B1.">\\(x_i^{(k+1)}\\)</span>**: Las coordenadas del elemento objetivo (corrección de velocidad/posición) que se actualizan para la restricción activa en el paso de iteración actual \\(k+1\\).
* **<span class="keyword-highlight" data-tooltip="Esta es la masa efectiva o valor del tensor de inercia, que muestra resistencia al movimiento. En la analogía, esto se mapea con el peso y agarre de B1.">\\(a_{ii}\\)</span>**: El elemento diagonal de la matriz del sistema que representa la masa efectiva de la articulación o contacto, definiendo la resistencia inercial a las correcciones.
* **<span class="keyword-highlight" data-tooltip="Esta es la fuerza externa pura sobre el objeto. En la analogía, representa el propio peso de B1 tirando de él hacia abajo.">\\(b_i\\)</span>**: El vector de sesgo externo que contiene la gravedad acumulada, velocidades iniciales, términos de compliancia y parámetros de corrección de errores de penetración (estabilización de Baumgarte).
* **<span class="keyword-highlight" data-tooltip="Esta es la lista T: las personas en la cima del acantilado tirando hacia arriba. Como la CPU ya resolvió estos elementos, tienen el estado actualizado k+1.">\\(\sum_{j=1}^{i-1} a_{ij} x_j^{(k+1)}\\)</span>**: Las fuerzas acumuladas de las restricciones vecinas que ya han sido procesadas en el barrido actual, utilizando su estado presente actualizado \\(k+1\\).
* **<span class="keyword-highlight" data-tooltip="Esta es la lista B: las personas colgando abajo tirando hacia abajo. Como la CPU no ha llegado a ellas en este ciclo, llevan el estado pasado k.">\\(\sum_{j=i+1}^{n} a_{ij} x_j^{(k)}\\)</span>**: Las fuerzas de las restricciones vecinas que aún no se han alcanzado en el barrido actual, basándose en su estado histórico \\(k\\) de la iteración anterior.
* **<span class="keyword-highlight" data-tooltip="Este es el coeficiente de acoplamiento que representa la rigidez de la red. En la analogía, se asocia con la fuerza de agarre.">\\(a_{ij}\\)</span>**: Los coeficientes de acoplamiento que definen la rigidez estructural y la transmisión de fuerzas entre coordenadas adyacentes.

### 3. El papel de la coherencia temporal

Para evitar que esta pesada reacción en cadena secuencial agote los ciclos de la CPU, el resolvedor inyecta un atajo temporal. Reutiliza las fuerzas de restricción (impulsos) calculadas en el fotograma anterior y las aplica como estimación inicial para el nuevo fotograma. Como los objetos apenas se mueven en una fracción de segundo, este truco de <span class="keyword-highlight" data-tooltip="En lugar de empezar de cero en cada fotograma, el resolvedor reutiliza el estado físico final del fotograma anterior como punto de partida. Como los objetos apenas se mueven en una fracción de segundo, este truco ahorra muchos ciclos de cálculo.">Coherencia Temporal</span> ahorra docenas de bucles de iteración y mantiene estables las redes de restricciones complejas.

Si analizamos la estructura matemática del resolvedor TGS, vemos que aísla una única restricción en el sistema. Filtra las fuerzas circundantes para enfocarse solo en la inercia (masa efectiva) y los sesgos externos del objeto objetivo.

Para calcular la corrección necesaria, la fórmula utiliza la inversa de la masa efectiva: \\(1 / a_{ii}\\). En simulaciones de física, esta inversa representa la <span class="keyword-highlight" data-tooltip="La masa y la inercia significan terquedad: cuánto se resiste un objeto a moverse. Pero para resolver restricciones, queremos movimiento. Así que las matemáticas voltean esta inercia al revés: 1/a_ii. Lo opuesto a la inercia es lo que llamamos Movilidad.">Movilidad</span>, que dicta con qué facilidad pueden desplazarse las coordenadas.

Dentro del paréntesis, el resolvedor comienza con el sesgo de fuerza externo aislado \\(b_i\\) y resta ambos términos de suma (los tirones de arriba y de abajo). El valor resultante es la <span class="keyword-highlight" data-tooltip="Digamos que el peso de B1 y el tirón de abajo suman 100 de fuerza hacia abajo. La persona de arriba tira con una fuerza de 90. Al restar, nos queda una fuerza neta hacia abajo de 10. Esa es la Fuerza Desequilibrada. Significa que B1 no está en equilibrio. Está siendo tirado hacia abajo.">Fuerza Desequilibrada</span>, también conocida como residuo del resolvedor.

Luego, el resolvedor multiplica la Movilidad del objeto objetivo por esta Fuerza Desequilibrada:

\\[
\text{Mobility } \left(\frac{1}{a_{ii}}\right) \times \text{Unbalanced Force}
\\]

Esta multiplicación determina el desplazamiento de coordenadas preciso requerido para eliminar el desequilibrio de fuerzas. Este <span class="keyword-highlight" data-tooltip="Este deslizamiento no es un error. Es el movimiento físico causado por esa fuerza neta de 10. Las matemáticas hacen que la mano de B1 se deslice a un nuevo punto donde todas las fuerzas se cancelan. Esa nueva posición de equilibrio local es nuestro resultado final.">Deslizamiento</span> no es un error numérico, sino el desplazamiento físico deliberado que lleva al sistema a un equilibrio local. A través de este cálculo matemático, las coordenadas se deslizan hacia una posición estable donde todas las fuerzas se cancelan, produciendo \\(x_i^{(k+1)}\\).

<div id="cliffhanger-drawer-spanish" class="drawer-container">
  <div class="drawer-backdrop" onclick="closeDrawer('cliffhanger-drawer-spanish')"></div>
  <div class="drawer-content">
    <div class="drawer-header">
      <h3>Deep Dive: La Analogía del Acantilado</h3>
      <button class="drawer-close-btn" onclick="closeDrawer('cliffhanger-drawer-spanish')">&times;</button>
    </div>
    <div class="drawer-body">

<h4>Analogía de la cadena colgante y mapeo con el resolvedor</h4>

<p>Para comprender los cálculos secuenciales de la relajación de Gauss-Seidel en términos visuales, analicemos un escenario extremo donde seis personas cuelgan en cadena desde el borde de un acantilado:</p>

<h5>1. El grupo de anclaje (Lista superior: T3, T2, T1)</h5>
<ul>
  <li><strong>T3 (Anclaje estático al suelo)</strong>: Firme en el suelo, este nodo no se mueve. En un motor de física, se asocia a un cuerpo de <code>BodyType::Static</code> con masa inversa cero (<code>inv_mass = 0.0</code>), proporcionando el anclaje base para toda la cadena.</li>
  <li><strong>T2 y T1 (Nodos intermedios)</strong>: Cuerpos dinámicos vinculados a T3 que proporcionan la tensión de soporte para sostener a B1. Dado que el resolvedor los procesa primero en su barrido, sus estados contienen cálculos actualizados del fotograma presente (\\(k+1\\)).</li>
</ul>

<h5>2. La cadena colgante (Lista inferior: B1, B2, B3)</h5>
<ul>
  <li><strong>B1 (El nodo de interfaz)</strong>: La primera persona colgando en el aire (<span class="keyword-highlight" data-tooltip="Este es el elemento objetivo siendo resuelto por el resolvedor. En la analogía del acantilado, representa a B1, quien está suspendido en el aire. El equilibrio de la cadena depende de B1.">B1</span>), ubicada justo en el borde del acantilado. Matemáticamente, el resolvedor aísla estas coordenadas de destino (\\(x_i^{(k+1)}\\)) durante su barrido. La estabilidad de toda la cadena depende del ajuste local de B1.</li>
  <li><strong>B2 (Conector intermedio)</strong>: El eslabón del medio (<span class="keyword-highlight" data-tooltip="Esta es la lista B: las personas colgando abajo tirando hacia abajo. Como la CPU no ha llegado a ellas en este ciclo, llevan el estado pasado k.">B2</span>) que sujeta las piernas de B1, transmitiendo el equilibrio de tensión hacia abajo.</li>
  <li><strong>B3 (Nodo colgante terminal)</strong>: El último eslabón de la cadena que soporta toda la gravedad acumulada. B3 y B2 aún no se han actualizado en el barrido actual, por lo que sus estados se leen a partir del índice de iteración anterior (\\(k\\)).</li>
</ul>

<h5>3. Equilibrio de fuerzas y deslizamiento de coordenadas</h5>
<p>B1 debe mantener el equilibrio local de acuerdo con las reglas de su sistema de coordenadas:</p>
<ul>
  <li><strong>Cálculo de la tensión residual</strong>: El tirón hacia arriba del grupo superior (valor de la lista T de 90) se compara con el arrastre hacia abajo del grupo inferior y el peso de B1 (que suman 100). Restar estos valores genera una desviación de tensión de 10, que es el residuo matemático (Fuerza Desequilibrada).</li>
  <li><strong>Ajuste del deslizamiento impulsivo</strong>: Para absorber esta diferencia de tensión de 10, B1 debe deslizar sus coordenadas a lo largo del plano de contacto hasta que las fuerzas se cancelen. Esta corrección constituye el deslizamiento de coordenadas, produciendo el valor actualizado de velocidad y posición dinámica (\\(x_i^{(k+1)}\\)).</li>
</ul>

</div>
</div>
</div>

<div id="silicon-drawer-spanish" class="drawer-container">
  <div class="drawer-backdrop" onclick="closeDrawer('silicon-drawer-spanish')"></div>
  <div class="drawer-content">
    <div class="drawer-header">
      <h3>Deep Dive: Verificación a Nivel de Silicio</h3>
      <button class="drawer-close-btn" onclick="closeDrawer('silicon-drawer-spanish')">&times;</button>
    </div>
    <div class="drawer-body">

<h4>Telemetría a nivel de silicio y lógica de ejecución</h4>

<p>Podemos verificar el comportamiento de las coordenadas matemáticas y las variables físicas directamente mediante el código de física en Rust y los registros de telemetría a nivel de hardware:</p>

<pre class="language-rust"><code class="language-rust">
let mut config = PhysicsConfig::default();
config.<span class="keyword-highlight" data-tooltip="El número de subintervalos en los que dividimos un solo fotograma de 1/60s (el aspecto temporal del resolvedor).">sub_steps</span> = 4;
config.<span class="keyword-highlight" data-tooltip="El número de pasadas de relajación de Gauss-Seidel que ejecutamos por subpaso.">iterations</span> = 12;

let mut world = PhysicsWorld::new(config);
let shape = Collider::Box(BoxShape::new(0.5, 0.5, 0.5));

let mut t3 = RigidBody::new(Vector3::new(0.0, 0.0, 0.0), shape);
t3.body_type = <span class="keyword-highlight" data-tooltip="Un cuerpo rígido que nunca se mueve, que representa un anclaje de masa infinita (como el acantilado).">BodyType::Static</span>;
t3.mass_props.<span class="keyword-highlight" data-tooltip="Establecer la masa inversa a cero matemáticamente significa masa infinita. No se puede mover.">inv_mass</span> = 0.0;
world.add_body(t3); // T3 Anchor

let mut t2 = RigidBody::new(Vector3::new(0.0, 1.0, 0.0), shape);
t2.body_type = <span class="keyword-highlight" data-tooltip="Un cuerpo rígido afectado por la gravedad y los impulsos (como las personas colgadas).">BodyType::Dynamic</span>;
world.add_body(t2); // T2

let mut t1 = RigidBody::new(Vector3::new(0.0, 2.0, 0.0), shape);
t1.body_type = BodyType::Dynamic;
world.add_body(t1); // T1

let mut b1 = RigidBody::new(Vector3::new(0.0, 3.0, 0.0), shape);
b1.body_type = BodyType::Dynamic;
let b1_handle = world.add_body(b1); // B1 Focus

let mut b2 = RigidBody::new(Vector3::new(0.0, 4.0, 0.0), shape);
b2.body_type = BodyType::Dynamic;
world.add_body(b2); // B2

let mut b3 = RigidBody::new(Vector3::new(0.0, 5.0, 0.0), shape);
b3.body_type = BodyType::Dynamic;
world.add_body(b3); // B3

world.<span class="keyword-highlight" data-tooltip="El punto de entrada principal que ejecuta la detección de colisiones y llama al resolvedor TGS para actualizar las posiciones.">update</span>(1.0 / 60.0, None, None);
</code></pre>

<h5>Registro de telemetría de ejecución</h5>
<p>A continuación se muestra el resultado en terminal generado al ejecutar el ciclo de actualización de un fotograma de simulación:</p>

<pre><code class="language-text">
--- TITAN ENGINE: SILICON-LEVEL TGS SOLVER DEMONSTRATION ---
Initial Setup Complete. B1 is sandwiched between T1 (Below) and B2 (Above).
B1 Initial Position Y: 3.0000
B1 Initial Velocity Y: 0.0000

Executing 1 Frame (dt = 0.0166)...
[SOLVE_TGS] Entry: <span class="keyword-highlight" data-tooltip="Las 5 articulaciones que conctan los 6 cuerpos en nuestra cadena del acantilado.">constraints=5</span>, <span class="keyword-highlight" data-tooltip="Lotes de ejecución paralela para resolver restricciones independientes.">batches=2</span>, bodies=5, iterations=12, <span class="keyword-highlight" data-tooltip="Restricciones resueltas usando la vectorización de carriles SIMD para mayor velocidad del hardware.">total_simd_constraints=2</span>

B1 Final Position Y: 3.000041
B1 Final Velocity Y: 0.003417
B1 Total 'Slip' (Displacement due to gravity and constraint resolution): 0.000041
------------------------------------------------------------
</code></pre>

<h5>Por qué TGS es el estándar en los motores de física en tiempo real modernos</h5>
<p>Los motores de física modernos utilizan la arquitectura del pipeline de Temporal Gauss-Seidel (TGS) en lugar del resolvedor tradicional Projected Gauss-Seidel (PGS). Desglosemos las razones técnicas que impulsan esta transición estructural:</p>

<ul>
  <li><strong>El problema del estiramiento (Limitaciones de PGS)</strong>: El método tradicional PGS resuelve las restricciones aplicando bucles de relajación sobre la duración completa del paso de tiempo del fotograma (16 ms). En cadenas articuladas largas (como ragdolls o puentes de cuerda), los errores se acumulan de forma global, provocando que las articulaciones se estiren de forma poco natural y generen una vibración visual inestable (efecto banda elástica).</li>
  <li><strong>La solución por subpasos (Enfoque TGS)</strong>: El flujo de ejecución de TGS divide el paso de tiempo completo del fotograma en múltiples subpasos discretos. Cada pasada de relajación funciona como un minisubpaso interno:
    <ul>
      <li>Los impulsos calculados se acumulan en un búfer global de velocidades delta.</li>
      <li>Las posiciones de coordenadas de las articulaciones se actualizan a mitad del fotograma, lo que permite recalcular las masas efectivas y los coeficientes jacobianos antes del siguiente bucle.</li>
      <li>El modelo de fricción se compila dinámicamente junto con la corrección de penetración dentro de todos los subpasos, evitando deslizamientos excesivos.</li>
    </ul>
  </li>
</ul>

</div>
</div>
</div>

Este principio fundamental de relajación de restricciones y estabilidad matemática es lo que sustenta los pipelines de física modernos. Detrás de escena, estas ecuaciones matemáticas se ejecutan silenciosamente en cada fotograma, suavizando los errores numéricos y garantizando la integridad estructural de la simulación en entornos altamente dinámicos.
