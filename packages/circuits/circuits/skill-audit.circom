pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

// SkillAudit: Proves a skill honored its declared permissions
// Public signals: skillHash, permissionHash, auditorCommitment, agentIdHash, timestamp
// Private inputs: skillSource, auditNonce, declaredPermissions, observedPermissions,
//                 auditorSecret, agentId

template SkillAudit() {
    // Private inputs
    signal input skillSource;
    signal input auditNonce;
    signal input declaredPermissions;   // 8-bit bitmask
    signal input observedPermissions;   // 8-bit bitmask (must be subset of declared)
    signal input auditorSecret;
    signal input agentId;
    signal input timestamp;

    // Public outputs
    signal output skillHash;
    signal output permissionHash;
    signal output auditorCommitment;
    signal output agentIdHash;
    signal output timestampOut;

    // 1. Compute skillHash = Poseidon(skillSource, auditNonce)
    component skillHasher = Poseidon(2);
    skillHasher.inputs[0] <== skillSource;
    skillHasher.inputs[1] <== auditNonce;
    skillHash <== skillHasher.out;

    // 2. Compute permissionHash = Poseidon(declaredPermissions)
    component permHasher = Poseidon(1);
    permHasher.inputs[0] <== declaredPermissions;
    permissionHash <== permHasher.out;

    // 3. Compute auditorCommitment = Poseidon(auditorSecret)
    component auditorHasher = Poseidon(1);
    auditorHasher.inputs[0] <== auditorSecret;
    auditorCommitment <== auditorHasher.out;

    // 4. Compute agentIdHash = Poseidon(agentId)
    component agentHasher = Poseidon(1);
    agentHasher.inputs[0] <== agentId;
    agentIdHash <== agentHasher.out;

    // 5. Pass through timestamp
    timestampOut <== timestamp;

    // 6. Bitmask subset check: observedPermissions must be a subset of declaredPermissions
    //    i.e., (observed & declared) == observed
    //    Equivalently: observed & (~declared) == 0
    //    We decompose both into bits and check bit-by-bit

    component declBits = Num2Bits(8);
    declBits.in <== declaredPermissions;

    component obsBits = Num2Bits(8);
    obsBits.in <== observedPermissions;

    // For each bit: if observed[i] == 1, then declared[i] must == 1
    // observed[i] * (1 - declared[i]) === 0
    signal violation[8];
    for (var i = 0; i < 8; i++) {
        violation[i] <== obsBits.out[i] * (1 - declBits.out[i]);
        violation[i] === 0;
    }
}

component main {public [timestamp]} = SkillAudit();
