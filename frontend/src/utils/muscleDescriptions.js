/**
 * Centralized muscle descriptions system
 * Provides detailed descriptions for muscle groups including location and function
 * Can be used across different components in the application
 */

/**
 * Centralized muscle descriptions system
 * Provides detailed descriptions for muscle groups including location and function
 * Can be used across different components in the application
 * Updated to include all muscles from the database
 */

export const muscleDescriptions = {
  // Chest Muscles
  'Pectoralis Major (Upper)': {
    location: 'Upper portion of the chest',
    function: 'Primary pushing muscle for incline movements and upper chest development',
    description: 'The upper portion of the pectoralis major is responsible for horizontal adduction and flexion of the arm, particularly in incline pressing movements.'
  },
  'Pectoralis Major (Middle)': {
    location: 'Middle portion of the chest',
    function: 'Primary pushing muscle for flat bench movements and general chest development',
    description: 'The middle portion of the pectoralis major is the main muscle worked in flat bench press and push-up movements.'
  },
  'Pectoralis Major (Lower)': {
    location: 'Lower portion of the chest',
    function: 'Primary pushing muscle for decline movements and lower chest development',
    description: 'The lower portion of the pectoralis major is emphasized in decline pressing movements and dips.'
  },
  'Pectoralis Minor': {
    location: 'Deep muscle beneath the pectoralis major',
    function: 'Stabilizes the scapula and assists in shoulder protraction',
    description: 'The pectoralis minor is a smaller muscle that helps stabilize the shoulder blade and assists in pushing movements.'
  },
  
  // Back Muscles
  'Latissimus Dorsi': {
    location: 'Large muscles on the sides of the back',
    function: 'Primary pulling muscle for lat pulldowns, pull-ups, and rowing movements',
    description: 'The latissimus dorsi are the largest muscles in the back, responsible for shoulder adduction, extension, and internal rotation.'
  },
  'Trapezius (Upper)': {
    location: 'Upper back and neck region',
    function: 'Elevates the shoulder blades and assists in neck extension',
    description: 'The upper trapezius elevates the shoulder blades and is worked in shrugs and overhead pressing movements.'
  },
  'Trapezius (Middle)': {
    location: 'Middle portion of the upper back',
    function: 'Retracts the shoulder blades and maintains posture',
    description: 'The middle trapezius retracts the shoulder blades and is crucial for maintaining good posture.'
  },
  'Trapezius (Lower)': {
    location: 'Lower portion of the upper back',
    function: 'Depresses the shoulder blades and assists in pulling movements',
    description: 'The lower trapezius depresses the shoulder blades and assists in pulling movements.'
  },
  'Rhomboids': {
    location: 'Upper back between shoulder blades',
    function: 'Retracts and stabilizes the shoulder blades',
    description: 'The rhomboid muscles retract and stabilize the shoulder blades, working together with the middle trapezius.'
  },
  'Erector Spinae': {
    location: 'Posterior of the lower torso along the spine',
    function: 'Extends and supports the spine',
    description: 'The erector spinae muscles extend and support the spine, preventing excessive forward flexion.'
  },
  'Teres Major': {
    location: 'Upper back near the shoulder blade',
    function: 'Assists in shoulder adduction and internal rotation',
    description: 'The teres major assists the latissimus dorsi in pulling movements and shoulder internal rotation.'
  },
  'Teres Minor': {
    location: 'Upper back near the shoulder blade',
    function: 'Part of the rotator cuff, assists in external rotation',
    description: 'The teres minor is part of the rotator cuff and assists in shoulder external rotation and stability.'
  },
  
  // Arm Muscles
  'Biceps Brachii': {
    location: 'Front of the upper arm',
    function: 'Primary muscle for elbow flexion and forearm supination',
    description: 'The biceps brachii flexes the elbow joint and supinates the forearm, working in curling movements.'
  },
  'Brachialis': {
    location: 'Deep muscle beneath the biceps',
    function: 'Assists in elbow flexion',
    description: 'The brachialis is a deep muscle that assists the biceps in elbow flexion, particularly in hammer curls.'
  },
  'Brachioradialis': {
    location: 'Forearm muscle on the thumb side',
    function: 'Assists in elbow flexion and forearm stabilization',
    description: 'The brachioradialis assists in elbow flexion and helps stabilize the forearm during gripping movements.'
  },
  'Triceps (Long Head)': {
    location: 'Back of the upper arm, inner portion',
    function: 'Primary muscle for elbow extension and shoulder extension',
    description: 'The long head of the triceps extends the elbow and assists in shoulder extension.'
  },
  'Triceps (Lateral Head)': {
    location: 'Back of the upper arm, outer portion',
    function: 'Primary muscle for elbow extension',
    description: 'The lateral head of the triceps is the main muscle for elbow extension in pressing movements.'
  },
  'Triceps (Medial Head)': {
    location: 'Back of the upper arm, deep portion',
    function: 'Assists in elbow extension',
    description: 'The medial head of the triceps assists in elbow extension and provides stability to the elbow joint.'
  },
  'Forearm Flexors': {
    location: 'Front of the forearm',
    function: 'Flexes the wrist and fingers, provides grip strength',
    description: 'The forearm flexors flex the wrist and fingers, providing grip strength for pulling movements.'
  },
  'Forearm Extensors': {
    location: 'Back of the forearm',
    function: 'Extends the wrist and fingers',
    description: 'The forearm extensors extend the wrist and fingers, working opposite to the flexors.'
  },
  
  // Shoulder Muscles
  'Anterior Deltoid': {
    location: 'Front of the shoulder',
    function: 'Flexes and internally rotates the shoulder',
    description: 'The anterior deltoid flexes and internally rotates the shoulder, working in front raises and pressing movements.'
  },
  'Lateral Deltoid': {
    location: 'Side of the shoulder',
    function: 'Abducts the shoulder (raises arm to the side)',
    description: 'The lateral deltoid abducts the shoulder, working in lateral raises and overhead pressing movements.'
  },
  'Posterior Deltoid': {
    location: 'Back of the shoulder',
    function: 'Extends and externally rotates the shoulder',
    description: 'The posterior deltoid extends and externally rotates the shoulder, working in rear delt raises and rowing movements.'
  },
  'Rotator Cuff': {
    location: 'Deep muscles around the shoulder joint',
    function: 'Stabilizes the shoulder joint and assists in rotation',
    description: 'The rotator cuff muscles stabilize the shoulder joint and assist in internal and external rotation.'
  },
  
  // Leg Muscles
  'Quadriceps (Rectus Femoris)': {
    location: 'Front of the thigh, middle portion',
    function: 'Extends the knee and flexes the hip',
    description: 'The rectus femoris extends the knee and flexes the hip, working in squats and leg extensions.'
  },
  'Quadriceps (Vastus Lateralis)': {
    location: 'Front of the thigh, outer portion',
    function: 'Extends the knee',
    description: 'The vastus lateralis extends the knee and is the largest of the quadriceps muscles.'
  },
  'Quadriceps (Vastus Medialis)': {
    location: 'Front of the thigh, inner portion',
    function: 'Extends the knee',
    description: 'The vastus medialis extends the knee and helps stabilize the patella.'
  },
  'Quadriceps (Vastus Intermedius)': {
    location: 'Front of the thigh, deep portion',
    function: 'Extends the knee',
    description: 'The vastus intermedius extends the knee and is located deep beneath the rectus femoris.'
  },
  'Hamstrings (Biceps Femoris)': {
    location: 'Back of the thigh, outer portion',
    function: 'Flexes the knee and extends the hip',
    description: 'The biceps femoris flexes the knee and extends the hip, working in deadlifts and leg curls.'
  },
  'Hamstrings (Semitendinosus)': {
    location: 'Back of the thigh, inner portion',
    function: 'Flexes the knee and extends the hip',
    description: 'The semitendinosus flexes the knee and extends the hip, working with the other hamstring muscles.'
  },
  'Hamstrings (Semimembranosus)': {
    location: 'Back of the thigh, deep portion',
    function: 'Flexes the knee and extends the hip',
    description: 'The semimembranosus flexes the knee and extends the hip, working deep within the hamstring group.'
  },
  'Glutes (Maximus)': {
    location: 'Largest muscle in the buttocks',
    function: 'Extends the hip and provides power for lower body movements',
    description: 'The gluteus maximus is the largest muscle in the body and provides power for hip extension in squats and deadlifts.'
  },
  'Glutes (Medius)': {
    location: 'Side of the hip',
    function: 'Abducts the hip and stabilizes the pelvis',
    description: 'The gluteus medius abducts the hip and stabilizes the pelvis during single-leg movements.'
  },
  'Glutes (Minimus)': {
    location: 'Deep muscle beneath the gluteus medius',
    function: 'Assists in hip abduction and internal rotation',
    description: 'The gluteus minimus assists in hip abduction and internal rotation, working with the gluteus medius.'
  },
  'Adductors': {
    location: 'Inner thigh muscles',
    function: 'Adducts the hip (brings leg toward midline)',
    description: 'The adductor muscles bring the leg toward the midline of the body and stabilize the hip.'
  },
  'Abductors': {
    location: 'Outer hip muscles',
    function: 'Abducts the hip (moves leg away from midline)',
    description: 'The abductor muscles move the leg away from the midline of the body and stabilize the hip.'
  },
  'Calves (Gastrocnemius)': {
    location: 'Back of the lower leg, upper portion',
    function: 'Plantar flexes the ankle and assists in knee flexion',
    description: 'The gastrocnemius plantar flexes the ankle and assists in knee flexion, working in calf raises and jumping movements.'
  },
  'Calves (Soleus)': {
    location: 'Back of the lower leg, deep portion',
    function: 'Plantar flexes the ankle',
    description: 'The soleus plantar flexes the ankle and works with the gastrocnemius in calf raises.'
  },
  'Tibialis Anterior': {
    location: 'Front of the lower leg',
    function: 'Dorsiflexes the ankle (lifts foot up)',
    description: 'The tibialis anterior dorsiflexes the ankle and helps control foot placement during walking and running.'
  },
  
  // Core Muscles
  'Rectus Abdominis': {
    location: 'Front of the abdomen',
    function: 'Flexes the spine and compresses the abdomen',
    description: 'The rectus abdominis flexes the spine and compresses the abdomen, working in crunches and sit-ups.'
  },
  'External Obliques': {
    location: 'Sides of the abdomen',
    function: 'Rotates and laterally flexes the spine',
    description: 'The external obliques rotate and laterally flex the spine, working in twisting and side-bending movements.'
  },
  'Internal Obliques': {
    location: 'Sides of the abdomen, deep to external obliques',
    function: 'Rotates and laterally flexes the spine',
    description: 'The internal obliques work with the external obliques to rotate and laterally flex the spine.'
  },
  'Transverse Abdominis': {
    location: 'Deepest abdominal muscle',
    function: 'Compresses the abdomen and stabilizes the spine',
    description: 'The transverse abdominis compresses the abdomen and provides deep core stability.'
  },
  'Serratus Anterior': {
    location: 'Side of the chest, beneath the armpit',
    function: 'Protracts the shoulder blade and stabilizes the scapula',
    description: 'The serratus anterior protracts the shoulder blade and stabilizes the scapula during pushing movements.'
  },
  
  // Other Muscles
  'Neck Flexors': {
    location: 'Front of the neck',
    function: 'Flexes the neck forward',
    description: 'The neck flexors flex the neck forward and help maintain proper head posture.'
  },
  'Neck Extensors': {
    location: 'Back of the neck',
    function: 'Extends the neck backward',
    description: 'The neck extensors extend the neck backward and help maintain proper head posture.'
  },
  
  // Legacy muscle names for backward compatibility
  'Chest': {
    location: 'Front of the upper torso',
    function: 'Primary pushing muscle for chest exercises like bench press, push-ups, and flyes',
    description: 'The chest muscles (pectorals) are located on the front of the upper torso and are responsible for horizontal adduction and flexion of the arm.'
  },
  'Back': {
    location: 'Posterior of the upper torso',
    function: 'Pulling muscles including lats, rhomboids, and traps for rowing and pulling movements',
    description: 'The back muscles include the latissimus dorsi, rhomboids, and trapezius, providing strength for pulling and maintaining posture.'
  },
  'Shoulders': {
    location: 'Upper arm connection to torso',
    function: 'Deltoid muscles for shoulder movement, abduction, and rotation',
    description: 'The shoulder muscles (deltoids) surround the shoulder joint and enable arm movement in all directions.'
  },
  'Biceps': {
    location: 'Front of the upper arm',
    function: 'Front arm muscles for pulling and curling movements',
    description: 'The biceps brachii are located on the front of the upper arm and flex the elbow joint.'
  },
  'Triceps': {
    location: 'Back of the upper arm',
    function: 'Back arm muscles for pushing and extending movements',
    description: 'The triceps brachii are located on the back of the upper arm and extend the elbow joint.'
  },
  'Forearms': {
    location: 'Lower arm from elbow to wrist',
    function: 'Lower arm muscles for grip strength and wrist movement',
    description: 'The forearm muscles control wrist flexion, extension, and provide grip strength.'
  },
  'Core': {
    location: 'Center of the body',
    function: 'Abdominal and core stabilizing muscles for posture and stability',
    description: 'The core muscles provide stability and support for the spine and pelvis.'
  },
  'Abs': {
    location: 'Front of the abdomen',
    function: 'Abdominal muscles for core strength and spinal flexion',
    description: 'The abdominal muscles (rectus abdominis) flex the spine and provide core stability.'
  },
  'Obliques': {
    location: 'Sides of the abdomen',
    function: 'Side abdominal muscles for rotation and lateral flexion',
    description: 'The oblique muscles allow rotation and lateral flexion of the spine.'
  },
  'Lower Back': {
    location: 'Posterior of the lower torso',
    function: 'Erector spinae for spinal support and extension',
    description: 'The lower back muscles (erector spinae) extend and support the spine.'
  },
  'Quads': {
    location: 'Front of the thigh',
    function: 'Front thigh muscles for leg extension and knee stabilization',
    description: 'The quadriceps are located on the front of the thigh and extend the knee joint.'
  },
  'Hamstrings': {
    location: 'Back of the thigh',
    function: 'Back thigh muscles for leg flexion and hip extension',
    description: 'The hamstrings are located on the back of the thigh and flex the knee joint.'
  },
  'Glutes': {
    location: 'Buttocks region',
    function: 'Hip muscles for power, stability, and hip extension',
    description: 'The gluteal muscles provide power for hip extension and maintain pelvic stability.'
  },
  'Calves': {
    location: 'Back of the lower leg',
    function: 'Lower leg muscles for ankle movement and plantar flexion',
    description: 'The calf muscles (gastrocnemius and soleus) enable plantar flexion of the ankle.'
  },
  'Traps': {
    location: 'Upper back and neck region',
    function: 'Upper back muscles for shoulder elevation and scapular movement',
    description: 'The trapezius muscles elevate and retract the shoulder blades.'
  },
  'Lats': {
    location: 'Large muscles on the sides of the back',
    function: 'Large back muscles for pulling movements and shoulder adduction',
    description: 'The latissimus dorsi are large muscles that adduct and extend the shoulder.'
  },
  'Delts': {
    location: 'Shoulder cap muscles',
    function: 'Shoulder muscles for arm movement and shoulder stability',
    description: 'The deltoid muscles provide shoulder stability and enable arm movement.'
  },
  'Pecs': {
    location: 'Chest region',
    function: 'Chest muscles for pushing movements and arm adduction',
    description: 'The pectoral muscles adduct and flex the arm across the chest.'
  },
  'Pectorals': {
    location: 'Front of the upper torso',
    function: 'Primary pushing muscle for chest exercises like bench press, push-ups, and flyes',
    description: 'The pectoral muscles are located on the front of the upper torso and are responsible for horizontal adduction and flexion of the arm.'
  },
  'Latissimus Dorsi (Legacy)': {
    location: 'Large muscles on the sides of the back',
    function: 'Large back muscles for pulling movements and shoulder adduction',
    description: 'The latissimus dorsi are large muscles that adduct and extend the shoulder.'
  },
  'Deltoids': {
    location: 'Shoulder cap muscles',
    function: 'Shoulder muscles for arm movement and shoulder stability',
    description: 'The deltoid muscles provide shoulder stability and enable arm movement.'
  },
  'Quadriceps': {
    location: 'Front of the thigh',
    function: 'Front thigh muscles for leg extension and knee stabilization',
    description: 'The quadriceps are located on the front of the thigh and extend the knee joint.'
  },
  'Hamstring': {
    location: 'Back of the thigh',
    function: 'Back thigh muscles for leg flexion and hip extension',
    description: 'The hamstrings are located on the back of the thigh and flex the knee joint.'
  },
  'Gluteals': {
    location: 'Buttocks region',
    function: 'Hip muscles for power, stability, and hip extension',
    description: 'The gluteal muscles provide power for hip extension and maintain pelvic stability.'
  },
  'Gastrocnemius': {
    location: 'Back of the lower leg',
    function: 'Lower leg muscles for ankle movement and plantar flexion',
    description: 'The gastrocnemius muscle enables plantar flexion of the ankle and provides power for jumping.'
  },
  'Soleus': {
    location: 'Back of the lower leg',
    function: 'Lower leg muscles for ankle movement and plantar flexion',
    description: 'The soleus muscle works with the gastrocnemius to enable plantar flexion of the ankle.'
  },
  'Trapezius': {
    location: 'Upper back and neck region',
    function: 'Upper back muscles for shoulder elevation and scapular movement',
    description: 'The trapezius muscles elevate and retract the shoulder blades.'
  }
};

/**
 * Get muscle description by muscle name
 * @param {string} muscleName - The name of the muscle
 * @returns {object} Object containing location, function, and description
 */
export const getMuscleDescription = (muscleName) => {
  return muscleDescriptions[muscleName] || {
    location: 'Muscle group location',
    function: 'Muscle group function',
    description: 'Muscle group for exercise movement'
  };
};

/**
 * Get all available muscle names
 * @returns {array} Array of muscle names
 */
export const getAllMuscleNames = () => {
  return Object.keys(muscleDescriptions);
};

/**
 * Get muscle description text for display
 * @param {string} muscleName - The name of the muscle
 * @returns {string} Formatted description text
 */
export const getMuscleDescriptionText = (muscleName) => {
  const muscle = getMuscleDescription(muscleName);
  return `${muscle.description} Located: ${muscle.location}. Function: ${muscle.function}.`;
};

export default muscleDescriptions;
