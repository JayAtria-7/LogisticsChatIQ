# Project Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION LAYER                        │
│                                                                  │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │   CLI        │         │  Web API     │  (Future)           │
│  │  Interface   │         │  (REST/WS)   │                     │
│  └──────┬───────┘         └──────────────┘                     │
└─────────┼──────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                 CONVERSATION LAYER                               │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐         │
│  │         ConversationManager                        │         │
│  │  - State machine (15+ states)                      │         │
│  │  - Dialogue flow control                           │         │
│  │  - User input routing                              │         │
│  │  - Response generation                             │         │
│  └──────┬──────────────────┬──────────────────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐
│   NLP Layer     │ │  Validation      │ │  Session        │
│                 │ │  Layer           │ │  Management     │
│ ┌─────────────┐ │ │ ┌──────────────┐ │ │ ┌─────────────┐ │
│ │NLPProcessor │ │ │ │Package       │ │ │ │Session      │ │
│ │- Intent     │ │ │ │Validator     │ │ │ │Manager      │ │
│ │  Recognition│ │ │ │- Dimensions  │ │ │ │- State      │ │
│ │- Entity     │ │ │ │- Weight      │ │ │ │- History    │ │
│ │  Extraction │ │ │ │- Address     │ │ │ │- Packages   │ │
│ │- Pattern    │ │ │ │- Cross-Val   │ │ │ │- Templates  │ │
│ │  Matching   │ │ │ │- Joi Schema  │ │ │ │- Auto-save  │ │
│ └─────────────┘ │ │ └──────────────┘ │ │ └─────────────┘ │
└─────────────────┘ └──────────────────┘ └─────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                    │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Models     │  │  Services    │  │  Utilities   │          │
│  │              │  │              │  │              │          │
│  │ - Package    │  │ - Export     │  │ - Shipping   │          │
│  │ - Session    │  │   Service    │  │   Calculator │          │
│  │ - Address    │  │ - Cost Calc  │  │ - Formatter  │          │
│  │ - Metadata   │  │ - Analytics  │  │ - Helpers    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PERSISTENCE LAYER                               │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  File System │  │  Memory      │  │  Exports     │          │
│  │              │  │  Cache       │  │              │          │
│  │ - Sessions   │  │ - Active     │  │ - JSON       │          │
│  │   (.session) │  │   Session    │  │ - CSV        │          │
│  │ - Auto-save  │  │ - Temp Data  │  │ - Summary    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Input Flow
```
User Input
    │
    ▼
CLI.handleUserInput()
    │
    ▼
ConversationManager.processInput()
    │
    ├──► NLPProcessor.process()
    │       │
    │       ├──► Intent Recognition
    │       └──► Entity Extraction
    │
    ├──► PackageValidator.validate()
    │       │
    │       ├──► Field Validation
    │       ├──► Cross Validation
    │       └──► Warning Generation
    │
    ├──► SessionManager.updatePackage()
    │       │
    │       └──► State Update
    │
    └──► Response Generation
            │
            ▼
        Display to User
```

### 2. Package Collection Flow
```
Start Session
    │
    ▼
Welcome State
    │
    ▼
For Each Package:
    │
    ├──► Package Type
    ├──► Dimensions
    ├──► Weight
    ├──► Fragile Status
    ├──► Priority Level
    ├──► Destination Address
    ├──► Sender Info (optional)
    ├──► Special Instructions (optional)
    ├──► Estimated Value (optional)
    ├──► Insurance Required
    └──► Tracking Preferences (optional)
    │
    ▼
Package Summary
    │
    ├──► Confirm → Save Package
    └──► Edit → Return to field
    │
    ▼
Add Another? → Yes/No
    │           │
    │           └──► Export Options
    │
    └──► Loop to "For Each Package"
```

### 3. Export Flow
```
Export Command
    │
    ▼
ExportService.exportAll()
    │
    ├──► Generate JSON
    │       │
    │       ├──► Metadata
    │       ├──► Packages Array
    │       ├──► Validation Status
    │       └──► User Information
    │
    ├──► Generate CSV
    │       │
    │       └──► Tabular Format
    │
    └──► Generate Summary
            │
            └──► Human-Readable Text
    │
    ▼
Write to Files
    │
    ▼
Return File Paths
```

## Component Interaction Diagram

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ Input
       ▼
┌─────────────────────────────────────────┐
│          CLI Interface                  │
│  - Input capture                        │
│  - Output formatting                    │
│  - Command routing                      │
└──────┬────────────────────────┬─────────┘
       │                        │
       │                        │ Display
       ▼                        ▼
┌──────────────────┐     ┌──────────────┐
│ Conversation     │────►│   Formatter  │
│ Manager          │     │   Utility    │
└──────┬───────────┘     └──────────────┘
       │
       │ Process
       ▼
┌──────────────────────────────────────────┐
│        Processing Pipeline               │
│                                          │
│  ┌────────────┐  ┌──────────────┐       │
│  │    NLP     │  │  Validation  │       │
│  │ Processor  │  │   Engine     │       │
│  └─────┬──────┘  └──────┬───────┘       │
│        │                │               │
│        └────────┬───────┘               │
│                 ▼                       │
│          ┌─────────────┐                │
│          │  Session    │                │
│          │  Manager    │                │
│          └──────┬──────┘                │
└─────────────────┼───────────────────────┘
                  │
                  │ State Update
                  ▼
           ┌──────────────┐
           │  Data Store  │
           │  - Memory    │
           │  - File      │
           └──────┬───────┘
                  │
                  │ Export
                  ▼
           ┌──────────────┐
           │   Export     │
           │   Service    │
           └──────┬───────┘
                  │
                  ▼
           ┌──────────────┐
           │  Output      │
           │  Files       │
           │  (JSON/CSV)  │
           └──────────────┘
```

## State Machine Diagram

```
                    ┌──────────┐
                    │ WELCOME  │
                    └────┬─────┘
                         │ yes
                         ▼
                ┌─────────────────┐
                │ ASKING_PACKAGE  │
                │     _TYPE       │
                └────┬────────────┘
                     │
                     ▼
                ┌─────────────────┐
                │   ASKING_       │
                │  DIMENSIONS     │
                └────┬────────────┘
                     │
                     ▼
                ┌─────────────────┐
                │   ASKING_       │
                │    WEIGHT       │
                └────┬────────────┘
                     │
                     ▼
                ┌─────────────────┐
                │   ASKING_       │
                │   FRAGILE       │
                └────┬────────────┘
                     │
                     ▼
                ┌─────────────────┐
                │   ASKING_       │
                │   PRIORITY      │
                └────┬────────────┘
                     │
                     ▼
                ┌─────────────────┐
                │   ASKING_       │
                │  DESTINATION    │
                └────┬────────────┘
                     │
                     ▼
                ┌─────────────────┐
                │   ASKING_       │
                │    SENDER       │
                └────┬────────────┘
                     │
                     ▼
                ┌─────────────────┐
                │   ASKING_       │
                │   SPECIAL_      │
                │ INSTRUCTIONS    │
                └────┬────────────┘
                     │
                     ▼
                ┌─────────────────┐
                │   ASKING_       │
                │    VALUE        │
                └────┬────────────┘
                     │
                     ▼
                ┌─────────────────┐
                │   ASKING_       │
                │  INSURANCE      │
                └────┬────────────┘
                     │
                     ▼
                ┌─────────────────┐
                │   ASKING_       │
                │  TRACKING_PREFS │
                └────┬────────────┘
                     │
                     ▼
                ┌─────────────────┐
                │   PACKAGE_      │
                │   SUMMARY       │
                └────┬────────────┘
                     │
              ┌──────┴──────┐
              │             │
         confirm          edit
              │             │
              ▼             ▼
        ┌──────────┐   ┌─────────┐
        │ ASKING_  │   │ EDITING │
        │ CONTINUE │   └─────────┘
        └────┬─────┘
             │
        ┌────┴────┐
        │         │
       yes       no
        │         │
        │         ▼
        │    ┌──────────┐
        │    │COMPLETED │
        │    └──────────┘
        │
        └────► Loop to ASKING_PACKAGE_TYPE
```

## Module Dependencies

```
┌─────────────────────────────────────────────┐
│              cli.ts (Entry)                 │
└──────────┬──────────────────────────────────┘
           │
           ├──► services/conversationManager.ts
           │    │
           │    ├──► services/sessionManager.ts
           │    ├──► nlp/processor.ts
           │    └──► validators/packageValidator.ts
           │
           ├──► services/exportService.ts
           │    └──► models/types.ts
           │
           ├──► utils/shippingCalculator.ts
           │    └──► models/types.ts
           │
           └──► utils/formatter.ts

models/types.ts          ◄──── (Used by all)
models/enums.ts          ◄──── (Used by all)
```

## Technology Stack

```
┌─────────────────────────────────────────────┐
│           Application Layer                 │
│         TypeScript + Node.js                │
└──────────┬──────────────────────────────────┘
           │
┌──────────┴──────────────────────────────────┐
│         Core Libraries                      │
│  - joi (Validation)                         │
│  - uuid (Session IDs)                       │
│  - natural/compromise (NLP)                 │
└──────────┬──────────────────────────────────┘
           │
┌──────────┴──────────────────────────────────┐
│         Development Tools                   │
│  - TypeScript Compiler                      │
│  - Jest (Testing)                           │
│  - ESLint (Linting)                         │
└──────────┬──────────────────────────────────┘
           │
┌──────────┴──────────────────────────────────┐
│         Runtime Environment                 │
│         Node.js 16+                         │
└─────────────────────────────────────────────┘
```

## Design Patterns Used

1. **State Pattern** - ConversationManager state machine
2. **Strategy Pattern** - Validation strategies
3. **Factory Pattern** - Session and package creation
4. **Singleton Pattern** - Service instances
5. **Observer Pattern** - Event handling (future)
6. **Repository Pattern** - Session persistence

## Security Architecture

```
User Input
    │
    ▼
┌─────────────────┐
│  Sanitization   │
│  - Trim/Clean   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Validation     │
│  - Type Check   │
│  - Schema Val   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Processing     │
│  - Safe Ops     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Storage        │
│  - UUID IDs     │
│  - No PII leak  │
└─────────────────┘
```

---

This architecture provides:
- ✅ Modularity and separation of concerns
- ✅ Scalability for future enhancements
- ✅ Testability at all layers
- ✅ Clear data flow and state management
- ✅ Security through validation and sanitization
