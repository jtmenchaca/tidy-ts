# Portal Messages Object-Centric Event Log Model

## Modeling Approach

**Design Process:**
1. **Define Objects First** - Identify the case object (Thread), actors (Patient, MA, Nurse, Provider), and artifacts (Appointment)
2. **Define Events Second** - Focus on WHAT happened (outcomes/actions), not WHO did it
3. **Objects + Events = Process** - The combination of which objects participate in which events reveals the actual workflow

**Key Principles:**
- **Events describe outcomes** - "Forward for Triage" (intent: clinical assessment) not "MA Forward to Nurse" (just roles)
- **Objects provide context** - Same event can involve different object types; the objects tell you WHO was involved
- **Thread is the case** - Every thread has a clear start (patient initiates) and end (archive), like Patient in ER modeling
- **Separation enables flexibility** - Adding new roles doesn't require new event types, just new object participation patterns

## Object Types

### Patient
- **Description**: Portal users who can send messages, request refills, and manage appointments
- **Instances**: pt1, pt2, pt3, pt4
- **Key Behaviors**: Login, send messages, read replies, request refills, archive messages

### MA (Medical Assistant)
- **Description**: First-line triage staff who review all incoming patient messages and route them appropriately
- **Instances**: ma1, ma2
- **Key Behaviors**: Review messages, reply directly to simple questions, forward to nurses for triage, forward to providers for complex cases, create appointments, archive messages, receive replies back from nurses/providers
- **Routing Logic**:
  - Direct response for simple administrative questions
  - Forward to Nurse for clinical triage needs
  - Forward to Provider for complex medical questions or prescription requests
  - Create appointments and respond when scheduling needed
  - Receive consultations back from Nurse or Provider before replying to patient

### Nurse
- **Description**: Clinical staff who handle triaged messages and can escalate to providers or route back to MA
- **Instances**: ns1, ns2
- **Key Behaviors**: Review messages (after MA forward), reply to patients, forward to providers for complex cases, forward back to MA when appropriate, receive replies from providers
- **Routing Flexibility**: Can send messages to Patient, Provider, or back to MA depending on complexity

### Provider
- **Description**: Healthcare providers who handle complex clinical questions and approve prescriptions
- **Instances**: pv1, pv2
- **Key Behaviors**: Review messages (after MA/Nurse forward), reply to patients, reply to nurses (for consultation), reply to MAs (for consultation), approve refills
- **Reply Targets**: Can reply directly to patient, to nurse (for nurse to relay), or to MA (for MA to relay)

### Thread
- **Description**: The primary case object representing a complete patient inquiry from initiation to resolution. A thread is always initiated by a patient and tracks all activities until the inquiry is closed/archived.
- **Instances**: thread1, thread2, thread3, thread4, thread5, thread6, thread7, thread8
- **Purpose**:
  - Acts as the "case" equivalent in traditional process mining
  - Links all routing, reviews, forwards, and replies for a single patient inquiry
  - Has a clear beginning (patient sends message) and end (archive/resolution)
  - Allows tracking of thread lifecycle: open → routed → responded → closed
- **Key Property**: Every thread belongs to exactly one patient (the initiator)

### Appointment
- **Description**: Scheduled medical appointments that can be created through the portal messaging system
- **Instances**: apt1, apt2
- **Key Behaviors**: Created by MA in response to patient messages

## Event Types

Events describe **what happened** (the outcome/action), not who did it. The participating objects tell us who was involved.

### Patient Login
- **Objects**: Patient
- **Description**: Patient accesses the portal system

### Send Message
- **Objects**: Patient, Thread
- **Description**: Patient sends a message, initiating a new thread or adding to existing thread
- **Note**: This is always the first event in a thread's lifecycle

### Initial Review
- **Objects**: MA, Thread
- **Description**: First triage of incoming patient message by MA to determine routing
- **Note**: Always performed by MA as first touchpoint after patient sends message

### Review Message
- **Objects**: (MA or Nurse or Provider), Thread
- **Description**: Staff member reviews thread content to determine next action
- **Examples**:
  - (MA, Thread) - MA reviewing after nurse sends back
  - (Nurse, Thread) - Nurse reviewing after MA forwards
  - (Provider, Thread) - Provider reviewing after nurse/MA forwards
  - (Nurse, Thread) - Nurse reviewing provider consultation before replying to patient

### Message to Patient
- **Objects**: (MA or Nurse or Provider), Thread
- **Description**: Staff member sends reply directly to patient
- **Examples**:
  - (MA, Thread) - MA handles simple administrative question
  - (Nurse, Thread) - Nurse replies after triage or after receiving provider consultation
  - (Provider, Thread) - Provider replies directly to complex clinical question

### Forward for Review
- **Objects**: (Staff Member 1), (Staff Member 2), Thread
- **Description**: One staff member routes thread to another for handling
- **Examples**:
  - (MA, Nurse, Thread) - MA escalates to nurse for clinical triage
  - (MA, Provider, Thread) - MA escalates to provider for complex clinical/prescription
  - (Nurse, Provider, Thread) - Nurse escalates to provider for clinical decision
  - (Nurse, MA, Thread) - Nurse routes back to MA for administrative handling
  - (Provider, Nurse, Thread) - Provider sends back to nurse after consultation
  - (Provider, MA, Thread) - Provider sends back to MA after consultation

### Consultation
- **Objects**: Provider, Thread
- **Description**: Provider provides clinical guidance/consultation (will not reply directly to patient; expects nurse/MA to relay)
- **Note**: Used when provider gives guidance but another staff member will communicate with patient

### Read Reply
- **Objects**: Patient, Thread
- **Description**: Patient reads a reply from any staff member

### Request Refill
- **Objects**: Patient, Thread
- **Description**: Patient requests a prescription refill
- **Note**: This can be either the first event (creating new thread) or within existing thread

### Approve Refill
- **Objects**: Provider, Thread
- **Description**: Provider approves a prescription refill request

### Create Appointment
- **Objects**: (MA or Nurse), Thread, Appointment
- **Description**: Staff member creates appointment in response to patient request
- **Note**: Typically done by MA, but nurses can also schedule. Creates new Appointment object linked to the thread.

### Archive Thread
- **Objects**: (Patient or MA or Nurse or Provider), Thread
- **Description**: Thread is marked as completed/archived
- **Note**: This is the terminal event in a thread's lifecycle