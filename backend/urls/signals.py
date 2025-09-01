# signals.py
from django.db.models.signals import post_migrate, post_save
from django.contrib.auth.models import Group, Permission, User
from django.apps import apps
from django.dispatch import receiver


@receiver(post_migrate)
def create_default_groups(sender, **kwargs):
    if sender.name == "urls":  # replace with your actual app name
        # Create or get "Moderators" group
        moderators_group, _ = Group.objects.get_or_create(name="Moderators")

        # Get permissions for your URL model
        url_model = apps.get_model("urls", "URLModel")
        permissions = Permission.objects.filter(
            content_type__app_label="urls",
            content_type__model="urlmodel"
        )

        # Assign them all (add/change/delete/view on URLModel)
        moderators_group.permissions.set(permissions)

        print("✅ Moderators group ensured with permissions.")


@receiver(post_save, sender=User)
def enforce_staff_group(sender, instance, **kwargs):
    """
    Ensure all staff are always in the Moderators group.
    """
    moderators_group, _ = Group.objects.get_or_create(name="Moderators")

    if instance.is_staff and not instance.is_superuser:
        if not instance.groups.filter(name="Moderators").exists():
            instance.groups.add(moderators_group)
            print(f"🔒 {instance.username} added to Moderators group.")
    else:
        # If they’re no longer staff, just remove them from the group
        if instance.groups.filter(name="Moderators").exists():
            instance.groups.remove(moderators_group)
            print(f"🚫 {instance.username} removed from Moderators group (not staff).")
