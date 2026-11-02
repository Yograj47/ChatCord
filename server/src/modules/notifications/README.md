# Notifications placeholder

This directory is not an active Nest module and contains no notification collection or delivery service.

The current Notifications screen combines existing [friendship requests](../friendships/README.md) and [room invitations](../rooms/README.md). Each owning module stores and authorizes its own data; the client presents both sections in one route.

Create a NotificationsModule only when the product defines an independent notification lifecycle such as durable unread state, delivery channels, acknowledgement and retention. Those decisions remain future work.
