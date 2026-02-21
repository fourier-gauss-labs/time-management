# Sprint 6 User Experience

**Sprint Intent**
This sprint makes introspection a first-class citizen by implementing a structured weekly review workflow. Users will pause, reflect on their drivers, and plan the week ahead—transforming the system from a passive task manager into an active partner in strategic thinking.

---

## Goals

Define what success looks like for this sprint.

- Implement a repeatable weekly review workflow that feels calm and purposeful
- Enable users to edit drivers and create milestones/actions during review
- Provide coach reminders for missed reviews to maintain consistency
- Create a UI state that encourages focus and reflection

---

## In Scope

Explicitly list what this sprint will cover.

- Weekly review workflow implementation
- Review day configuration (user-selectable)
- Driver editing capabilities during review
- Milestone and action creation within the review context
- Coach reminder system for missed reviews
- Focused, calm UI state for review mode
- Minimal persistence enhancements to support review state

---

## Application Layout

UX requirements

- The top banner shall remain fixed at the top of the viewport with a fully opaque background, ensuring it stays visible above scrolling content and prevents any content from showing beneath it.
- The left navigation sidebar shall remain fixed in position on desktop screens, ensuring navigation functions are always accessible to the user without scrolling away. The main content area shall be appropriately offset to prevent overlap with the fixed sidebar.

---

## Weekly Review

UX requirements

- From the home screen, the app shall determine if a "weekly review" is necessary. It does this by checking if a review has occured within the past week. If the review is necessary, then the "Weekly Review Due" message is displayed which includes a link to the review page.
- When the Review screen is opened, the app shall display all the drivers. Each driver stands at the top of a hierarchy of milestones and actions. When displayed, the page shall provide a method of expanding the hierarchies such that the user can browse their entire set of drivers, milestones, and actions.
- The UX for weekly reviews allows the user to manage their drivers, milestones, and actions.
- Drivers are the users high-levels goals; actions are the day to day tasks; milestones are projects needed to achieve the drivers/goals and are comprised of actions.
- When performing a weekly review the user must have the ability to add, change, and delete drivers, milestone, and actions.
- The weekly review shall support dragging milestones from one drive to another.
- The weekly review shall support dragging actions from one milestone to another.
- Every milestone must have either a driver or a milestone as its' parent. An action must have either a driver or a milestone as its' parent. In this way, milestones can be nested.
- An action cannot have another action as its' parent.
- An action can be converted into a milestone. This is how tasks are broken down into sub-tasks; the sub-tasks in this situation are actions.
- An action has a status. The status is one of the following: not started, in progress, complete, canceled, carried over.
- Action status are represented by icons. The icons are "not started" = a circle with no fill; "in progress" = a circle with solid fill; "complete" = checkmark; "canceled" = an X; "carrier over" = a right arrow.
- A milestone is either done or not done. It is done only if all its' actions are complete or canceled.
