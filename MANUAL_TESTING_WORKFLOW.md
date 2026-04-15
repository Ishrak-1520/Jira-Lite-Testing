# Jira-Lite: Comprehensive Manual Testing Workflow

This document provides a complete, step-by-step workflow to manually test the entire Jira-Lite application from front to back. By following this guide, you will verify the core functionality, role-based access control, system resilience, and the AI reporting pipeline.

---

## 🛠 Preparation

1.  **Restart the Server:** Since Jira-Lite uses an in-memory database, restarting the server ensures a perfectly clean slate.
    ```bash
    # In your terminal running the backend:
    Ctrl + C
    npm start
    ```
2.  **Open the Application:** Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Phase 1: Authentication & Identity

**Test 1: Registration (Admin Check)**
1.  On the Login screen, click **Register**.
2.  Attempt to register an account with the username `admin`, any email, password `admin123`, and Name `System Admin`.
3.  *Expected Result:* Registration succeeds. The default `admin` hardcoded check immediately grants this account the **`admin`** role.

**Test 2: Validation Safeguards (Fuzzer Mitigations)**
1.  Log out, click **Register** again.
2.  Attempt to register a username with an XSS script: `"><img src=x onerror=alert(1)>`.
3.  *Expected Result:* The form/API correctly **rejects** the input, displaying an invalid character error (thanks to our validation patches).

**Test 3: Standard Member Registration**
1.  Register a normal test user (e.g., username `johndoe`, password `password123`, Name `John Doe`).
2.  *Expected Result:* Account created successfully and routed to the Dashboard. Role assigned: **`member`**.

---

## Phase 2: Administrative Setup (Teams & Projects)

*Sign in using your newly created `admin` account.*

**Test 1: Team Creation & Security**
1.  Navigate to the **Teams** tab.
2.  Click **Create Team**. Enter a valid name (e.g., `Engineering Alpha`) and description.
3.  *Expected Result:* The team is successfully created and appears in the list.
4.  *Security Check:* Try creating a team with the name `<script>alert('hack')</script>`. The system must reject this.

**Test 2: Member Management**
1.  On the `Engineering Alpha` team card, add `johndoe` as a member.
2.  *Expected Result:* The team member count updates, and John Doe is now formally associated with the team.

**Test 3: Project Initialization**
1.  Navigate to the **Projects** tab.
2.  Click **Create Project**. Provide a Name (`Frontend Redesign`), a 2-10 Character Key (e.g., `FE`), and select the `Engineering Alpha` team.
3.  *Expected Result:* Project creates successfully. The `FE` key is validated strictly.

---

## Phase 3: The Core User Experience (Issues & Kanban)

*Sign out of the admin account and sign in as `johndoe` (the team member).*

**Test 1: Viewing Projects**
1.  Navigate to the **Projects** tab. You should see `Frontend Redesign` available.
2.  Click on the project card to enter the Kanban board.

**Test 2: Issue Creation**
1.  Click **Create Issue**.
2.  Title: `Build Navigation Header`
    Type: `Epic`
    Priority: `High`
    Description: `Implement responsive header.`
3.  *Expected Result:* Issue appears automatically in the **Open** column.

**Test 3: State Transitions (The Kanban Pipeline)**
1.  Click the newly created issue to open its detail view.
2.  Use the status dropdown to transition the issue from **Open** -> **In Progress**.
3.  *Expected Result:* The ticket visually moves to the "In Progress" column on the board.
4.  Transition it further to **Resolved** and eventually **Closed**. This mimics a real lifecycle.

**Test 4: Collaboration (Commenting)**
1.  Open any issue. Type a comment in the discussion box: "I've started working on the CSS for this."
2.  *Expected Result:* The comment posts immediately, tagging it with `John Doe` and a "Just now" timestamp.

---

## Phase 4: Automated Testing & Fuzzing Validation (The Test Harness)

*This phase leverages your custom assignment requirement to verify the entire system automagically.*

1.  Navigate to the **Test Harness** tab on your left navigation menu.
2.  Click **Run All Tests**.
    *   *Expected Result:* The system runs auth, permission, interaction, and edge-case suites. All basic logic tests should light up Green (Pass).
3.  Once the standard tests finish, click **Run Fuzzer**.
    *   *Expected Result:* The Fuzzer will forcefully attack the API with HTML injections, missing fields, and type misalignments. Thanks to our validation fixes, **100% of these malicious payloads should be rejected by the server**, resulting in a perfect passing score for the Fuzzer!

---

## Phase 5: AI Reporting System (PDF & MD Export)

1.  Ensuring you have just completed running the Fuzzer and Test suites, click the **Generate AI Analysis** button on the Test Harness screen.
    > [!IMPORTANT]
    > Verify that your `.env` file containing the `LONGCAT_API_KEY` is saved and active in the backend directory.
2.  *Wait ~10-15 seconds* for the LLM to process your test results.
3.  *Expected Result:* A large, beautifully formatted modal will appear titled **System Testing & QA Report**.
4.  **Formatting Check:** Verify the report follows a corporate structure (Executive Summary, Vulnerability Assessment, etc.) with zero mentions of "student", "assignment", or "university".
5.  **Export Test:**
    *   Click **Download .MD**. Verify a `.md` text file is downloaded instantly.
    *   Click **Download .PDF**. The screen may flash briefly as `html2pdf.js` captures the document. Verify a multi-page PDF is downloaded, featuring elegant typography and styling exactly matching the on-screen preview.

---

### 🎉 Conclusion
If you can successfully progress from Phase 1 through Phase 5 without any raw HTML strings appearing on your UI, without the backend crashing during fuzzing, and successfully saving your corporate PDF—your Jira-Lite system is robust, secure, and completed!
